"use strict";

// Weather per stage: clear, rain, snow or windy. Wind gently pushes every egg in flight (both
// armies equally) and is shown by a wind sock in the middle of the battlefield.
// Phase 2 adds fog, thunderstorms, hail and heat waves (DESIGN.md section 12). They join a
// biome's weather table from their `minStage`, and like all weather they treat both armies alike:
//   fog    ground units only see (and shoot at) enemies within FOG_VISIBILITY of the screen width
//   storm  rain plus telegraphed lightning strikes that deal 1 hit around the strike point
//   hail   hailstones bounce off the ground; every aircraft takes a hit now and then
//   heat   the air shimmers and eggs swell up (bigger eggs are easier to hit with)

const WEATHER_TYPES = [
  { id: "clear", weight: 5 },
  { id: "rain", weight: 2 },
  { id: "snow", weight: 1.5 },
  { id: "windy", weight: 1.5 },
];
// Horizontal egg acceleration (px/s^2) at full wind strength.
const WIND_ACCEL = 38;
const FOG_VISIBILITY = 0.4;
const LIGHTNING_PERIOD = [5, 9];
const LIGHTNING_WARN = 1.3;
const LIGHTNING_RADIUS = 46;
const HAIL_HIT_PERIOD = [5, 9];
const HEAT_EGG_SCALE = 1.35;

const WEATHER_INFO = {
  clear: { label: "" },
  rain: { label: "RAIN" },
  snow: { label: "SNOW" },
  windy: { label: "WINDY" },
  fog: { label: "FOG", minStage: 6, tip: "Fog! Ground troops can only see enemies close by - aircraft see fine." },
  storm: { label: "THUNDERSTORM", minStage: 9, tip: "Thunderstorm! Lightning strikes where the ground flickers - both armies get zapped." },
  hail: { label: "HAIL", minStage: 12, tip: "Hail! Aircraft get dinged by hailstones now and then." },
  sandstorm: { label: "SANDSTORM", minStage: 8, tip: "Sandstorm! Strong winds push every egg, and aircraft can barely aim through the dust." },
  heat: { label: "HEAT WAVE", minStage: 12, tip: "Heat wave! Eggs swell up in the heat, so they're easier to hit with." },
};

const Weather = {
  type: "clear",
  wind: 0,
  drops: [],
  gust: 0,
  fogBanks: [],

  // `force` picks the weather directly (used by tests and tools).
  regenerate(stage, biome = null, force = null) {
    const random = seededRandom(stage * 104729 + 7);
    const table = (biome && biome.weather
      ? Object.entries(biome.weather).map(([id, weight]) => ({ id, weight }))
      : WEATHER_TYPES).filter((w) => stage >= ((WEATHER_INFO[w.id] || {}).minStage || 0));
    if (stage <= 2) {
      this.type = "clear";
    } else {
      const total = table.reduce((sum, w) => sum + w.weight, 0);
      let roll = random() * total;
      this.type = (table.find((w) => (roll -= w.weight) <= 0) || table[0]).id;
    }
    if (force) this.type = force;
    const dir = random() < 0.5 ? -1 : 1;
    const strength = this.type === "sandstorm" ? 0.85 + random() * 0.15 : this.type === "windy" ? 0.7 + random() * 0.3 : this.type === "clear" ? random() * 0.15 : 0.15 + random() * 0.3;
    this.baseWind = dir * strength;
    this.wind = this.baseWind;
    this.gust = 0;
    this.drops = [];
    const count = { rain: 160, storm: 190, snow: 110, windy: 18, hail: 70, sandstorm: 70 }[this.type] || 0;
    for (let i = 0; i < count; i++) this.drops.push(this.newDrop(true));
    this.fogBanks = [];
    if (this.type === "fog") {
      for (let i = 0; i < 14; i++) this.fogBanks.push({ x: (i / 14) * W + random() * 80, y: H * (0.45 + random() * 0.35), r: 140 + random() * 130, v: 6 + random() * 10 });
    }
    this.strike = null;
    this.lightningTimer = rand(LIGHTNING_PERIOD[0], LIGHTNING_PERIOD[1]);
    this.flash = 0;
    this.time = 0;
  },

  info() {
    return WEATHER_INFO[this.type] || WEATHER_INFO.clear;
  },

  // How far (px) ground units can see in fog; Infinity otherwise.
  visibility() {
    return this.type === "fog" ? W * FOG_VISIBILITY : Infinity;
  },

  eggScale() {
    return this.type === "heat" ? HEAT_EGG_SCALE : 1;
  },

  isWindy() {
    return this.type === "windy" || this.type === "sandstorm";
  },

  // Extra random aim error (px) for aircraft dropping or shooting eggs through a sandstorm.
  airSpread() {
    return this.type === "sandstorm" ? s(90) : 0;
  },

  isRainy() {
    return this.type === "rain" || this.type === "storm";
  },

  // Gameplay side of the weather: lightning and hail. Called from the battle update only.
  updateBattle(game, dt) {
    if (this.type === "storm") {
      if (this.strike) {
        this.strike.timer -= dt;
        if (this.strike.timer <= 0 && !this.strike.hit) this.lightning(game, this.strike);
        if (this.strike.timer <= -0.35) this.strike = null;
      } else if ((this.lightningTimer -= dt) <= 0) {
        this.lightningTimer = rand(LIGHTNING_PERIOD[0], LIGHTNING_PERIOD[1]);
        this.strike = { x: rand(W * 0.15, W * 0.85), timer: LIGHTNING_WARN, hit: false };
      }
    }
    if (this.type === "hail") {
      for (const u of game.living()) {
        if (!(u instanceof Airplane) || u.isBoss) continue;
        if (u.hailTimer === undefined) u.hailTimer = rand(HAIL_HIT_PERIOD[0], HAIL_HIT_PERIOD[1]);
        if ((u.hailTimer -= dt) > 0) continue;
        u.hailTimer = rand(HAIL_HIT_PERIOD[0], HAIL_HIT_PERIOD[1]);
        Effects.spawn("spark", u.x, u.y - s(10), rand(-40, 40), rand(-80, -30), 0.25, 5, WHITE);
        audio.play("tank_hit");
        game.damageUnit(u, 1);
      }
    }
  },

  lightning(game, strike) {
    strike.hit = true;
    const ground = game.terrain.yAt(strike.x);
    // A jagged bolt from the clouds down to the strike point.
    strike.bolt = [[strike.x + rand(-60, 60), 0]];
    const steps = 9;
    for (let i = 1; i < steps; i++) strike.bolt.push([strike.x + rand(-26, 26) * (1 - i / steps), (ground * i) / steps]);
    strike.bolt.push([strike.x, ground]);
    this.flash = 0.35;
    const r = s(LIGHTNING_RADIUS);
    for (const u of game.living()) {
      if (u.isBoss) continue;
      if (Math.abs(u.x - strike.x) <= r + u.radius() * 0.5) game.damageUnit(u, 1);
    }
    for (let i = 0; i < 3; i++) game.addTerrainSplat(strike.x + rand(-r, r));
    Effects.explosion(strike.x, ground, 1.2, LINE);
    Effects.sparks(strike.x, ground - 10, 10, YOLK);
    Effects.shake(6);
    audio.play("thunder");
  },

  newDrop(anywhere) {
    return {
      x: rand(-40, W + 40),
      y: anywhere ? rand(0, H) : rand(-40, -5),
      v: this.isRainy() ? rand(520, 700) : this.type === "snow" ? rand(30, 60) : this.type === "hail" ? rand(380, 520) : rand(0, 10),
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
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt);
    for (const f of this.fogBanks) {
      f.x += (f.v + this.wind * 30) * dt;
      if (f.x - f.r > W) f.x = -f.r;
      if (f.x + f.r < 0) f.x = W + f.r;
    }
    this.wind = this.baseWind * (1 + 0.25 * Math.sin(this.gust * 0.7));
    const windPx = this.wind * 120;
    for (const d of this.drops) {
      if (this.isRainy()) {
        d.x += windPx * 1.4 * dt;
        d.y += d.v * dt;
      } else if (this.type === "hail") {
        d.x += windPx * 0.6 * dt;
        d.vy = (d.vy ?? d.v) + (d.bounced ? GRAVITY * dt : 0);
        d.y += d.vy * dt;
        if (!d.bounced && terrain && d.y >= terrain.yAt(clamp(d.x, 0, W))) {
          d.bounced = true;
          d.y = terrain.yAt(clamp(d.x, 0, W)) - 1;
          d.vy = -rand(80, 160);
          d.x += rand(-4, 4);
          continue;
        }
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
        if (this.type === "hail") d.bounced = false, d.vy = undefined;
        if (this.isRainy() && d.y > ground && Math.random() < 0.15) Effects.spawn("drop", d.x, ground, rand(-20, 20), rand(-60, -20), 0.2, 1.2, WHITE);
        Object.assign(d, this.newDrop(!this.isWindy()));
        if (this.isWindy()) {
          d.x = this.wind > 0 ? -30 : W + 30;
          d.y = rand(H * 0.3, H * 0.85);
        }
      }
    }
  },

  // One soft fog puff, rendered once per colour scheme and scaled for every fog bank.
  fogSprite() {
    if (this.fogPuff && this.fogPuffKey === PAPER) return this.fogPuff;
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, rgbaFromHex(PAPER, 0.6));
    grad.addColorStop(0.6, rgbaFromHex(PAPER, 0.3));
    grad.addColorStop(1, rgbaFromHex(PAPER, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    this.fogPuff = c;
    this.fogPuffKey = PAPER;
    return c;
  },

  // Fog banks, heat shimmer, the storm's gloom and lightning; drawn over the battlefield.
  drawOverlay(game) {
    if (this.type === "fog") {
      ctx.save();
      ctx.fillStyle = rgbaFromHex(PAPER, 0.12);
      ctx.fillRect(0, 0, W, H);
      const puff = this.fogSprite();
      for (const f of this.fogBanks) ctx.drawImage(puff, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      ctx.restore();
    }
    if (this.type === "sandstorm") {
      ctx.fillStyle = "rgba(205,160,90,0.2)";
      ctx.fillRect(0, 0, W, H);
    }
    if (this.type === "heat") {
      ctx.save();
      ctx.strokeStyle = "rgba(255,150,50,0.32)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const y0 = H * 0.5 + i * 26;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 16) {
          const y = y0 + Math.sin(x * 0.03 + this.time * 3 + i) * 4;
          if (x) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,170,60,0.06)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (this.type === "storm") {
      ctx.fillStyle = "rgba(30,30,55,0.12)";
      ctx.fillRect(0, 0, W, H);
      const st = this.strike;
      if (st && !st.hit) {
        // Warning: the ground flickers where the bolt is about to land.
        const ground = game.terrain.yAt(st.x);
        const on = Math.floor(this.time * 14) % 2 === 0;
        ctx.save();
        ctx.globalAlpha = on ? 0.9 : 0.35;
        ctx.strokeStyle = YOLK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(st.x, ground, s(LIGHTNING_RADIUS), s(10), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = LINE;
        ctx.font = "bold 22px Courier New";
        ctx.fillText("!", st.x - 6, ground - s(30));
        ctx.restore();
      }
      if (st && st.bolt) {
        ctx.save();
        ctx.globalAlpha = clamp(1 + st.timer * 3, 0, 1);
        for (const [w, c] of [[7, YOLK], [2.5, WHITE]]) {
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          st.bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,240,${(this.flash * 1.4).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
  },

  draw() {
    if (!this.drops.length) return;
    ctx.save();
    if (this.type === "hail") {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = rgbaFromHex(LINE, 0.5);
      ctx.lineWidth = 1;
      for (const d of this.drops) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.6 * d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this.isRainy()) {
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
      ctx.strokeStyle = this.type === "sandstorm" ? "rgba(150,105,50,0.55)" : rgbaFromHex(LINE, 0.45);
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
    const name = this.info().label;
    return `${name ? name + "  " : ""}${level} ${strength >= 0.2 ? arrow.repeat(strength < 0.55 ? 1 : 2) : ""}`.trim();
  },
};

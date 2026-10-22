"use strict";

// Biome hazards. They sit in the middle of the field, mirrored around the centre, and affect
// both armies the same way, so they add tactics without favouring a side.
//   lava    (Volcano)  vent that erupts every few seconds: 1 hit to ground units on top of it
//   ice     (Snowfield) slick patch: ground units slide across 70% faster
//   sand    (Desert)   quicksand: ground units crawl through at 40% speed
//   geyser  (Kitchen)  hot pan that blasts steam: 1 hit to ground units above it

const HAZARD_TYPES = {
  lava: { biome: "volcano", width: 70, period: [5, 8], warn: 1.2, name: "Lava vents", tip: "Lava vents erupt every few seconds - don't park on them!" },
  ice: { biome: "snow", width: 150, speed: 1.7, name: "Ice", tip: "Ice patches make ground units slide across faster." },
  sand: { biome: "desert", width: 120, speed: 0.4, name: "Quicksand", tip: "Quicksand slows ground units to a crawl - a great place to drop eggs." },
  mud: { biome: "swamp", width: 130, speed: 0.3, name: "Mud pits", tip: "Mud pits bog ground units right down - perfect for a Yolk Drop." },
  syrup: { biome: "candy", width: 80, period: [6, 9], warn: 1.2, sticky: 2.5, name: "Syrup geysers", tip: "Syrup geysers glue troops in place for a moment - both armies." },
  grave: { biome: "graveyard", width: 70, period: [6, 9], warn: 1.2, hold: 1.6, name: "Restless graves", tip: "Restless graves! Skeleton hands grab anyone standing on them for a moment." },
  vines: { biome: "jungle", width: 110, period: [6, 9], warn: 1.2, hold: 1.2, sound: "slime", name: "Creeping vines", tip: "Creeping vines lash out and tangle anyone standing on them for a moment." },
  tar: { biome: "prehistoric", width: 120, speed: 0.35, name: "Tar pits", tip: "Bubbling tar pits slow ground units right down - a fine spot for a Yolk Drop." },
  warp: { biome: "alien", width: 60, name: "Warp pads", tip: "Warp pads! Step on one and you pop out of the other - both armies." },
  tide: { biome: "beach", width: 140, speed: 0.55, name: "Tide pools", tip: "Tide pools slow ground units down - wade carefully." },
  geyser: { biome: "kitchen", width: 80, period: [6, 9], warn: 1.2, name: "Hot pans", tip: "Hot pans blast steam every few seconds - keep your troops clear." },
};

const Hazards = {
  zones: [],

  generate(biome, terrain) {
    this.zones = [];
    const entry = Object.entries(HAZARD_TYPES).find(([, h]) => h.biome === biome.id);
    if (!entry) return;
    const [type, def] = entry;
    // One pair mirrored around the centre, and sometimes one in the exact middle.
    const offset = rand(W * 0.1, W * 0.2);
    const xs = [W / 2 - offset, W / 2 + offset];
    if (Math.random() < 0.5 && type !== "warp") xs.push(W / 2);
    for (const x of xs) {
      this.zones.push({ type, def, x, half: def.width / 2, timer: def.period ? rand(def.period[0], def.period[1]) : 0, flash: 0 });
    }
    // Keep the middle wind sock clear of a centre hazard by nudging it aside visually only.
    this.terrain = terrain;
  },

  isGround(u) {
    return !(u instanceof Airplane) && !(u instanceof Castle);
  },

  zoneAt(x) {
    return this.zones.find((z) => Math.abs(x - z.x) <= z.half);
  },

  // Multiplier applied to a unit's movement this frame.
  speedFactor(u) {
    if (!this.zones.length || !this.isGround(u) || u.hover) return 1;
    const z = this.zoneAt(u.x);
    return z && z.def.speed ? z.def.speed : 1;
  },

  update(game, dt) {
    if (this.zones.length && this.zones[0].type === "warp") this.warp(game, dt);
    for (const z of this.zones) {
      z.flash = Math.max(0, z.flash - dt);
      if (!z.def.period) continue;
      z.timer -= dt;
      const ground = game.terrain.yAt(z.x);
      if (z.timer > 0 && z.timer < z.def.warn && Math.random() < dt * 12) {
        // Warning bubbles before it goes off.
        Effects.spawn("smoke", z.x + rand(-z.half * 0.6, z.half * 0.6), ground - 4, rand(-6, 6), rand(-30, -15), 0.6, 3, z.type === "lava" ? RED : LINE);
      }
      if (z.timer <= 0) {
        z.timer = rand(z.def.period[0], z.def.period[1]);
        z.flash = 0.6;
        this.erupt(game, z, ground);
      }
    }
  },

  // Warp pads come in a mirrored pair: a ground unit stepping on one pops out of the other.
  warp(game, dt) {
    const [a, b] = this.zones;
    for (const u of game.living()) {
      if (u.warpCool > 0) {
        u.warpCool = Math.max(0, u.warpCool - dt);
        continue;
      }
      if (!this.isGround(u) || u.isBoss || u.airborne) continue;
      const from = Math.abs(u.x - a.x) <= a.half * 0.6 ? a : Math.abs(u.x - b.x) <= b.half * 0.6 ? b : null;
      if (!from) continue;
      const to = from === a ? b : a;
      Effects.spawn("ring", u.x, u.y, 0, 0, 0.4, 10, "#b36cf0");
      u.x = to.x + (u.x - from.x);
      u.warpCool = 3;
      from.flash = to.flash = 0.4;
      Effects.spawn("ring", u.x, u.y, 0, 0, 0.4, 10, "#b36cf0");
      audio.play("zap");
    }
  },

  erupt(game, z, ground) {
    if (z.def.hold) {
      // Skeleton hands pop up and hold whoever stands on the grave (no damage).
      z.hands = 1;
      Effects.debris(z.x, ground, 5, LINE);
      audio.play(z.def.sound || "boo");
      for (const u of game.living()) {
        if (this.isGround(u) && Math.abs(u.x - z.x) <= z.half + u.blockingRadius() * 0.5) u.posing = Math.max(u.posing || 0, z.def.hold);
      }
      return;
    }
    if (z.def.sticky) {
      // Syrup: a sticky fountain that glues troops instead of hurting them.
      for (let i = 0; i < 16; i++) Effects.spawn("drop", z.x + rand(-z.half * 0.4, z.half * 0.4), ground - 6, rand(-50, 50), rand(-340, -180), rand(0.6, 1), rand(2.5, 4), "#d98a2b");
      audio.play("slime");
      for (const u of game.living()) {
        if (this.isGround(u) && Math.abs(u.x - z.x) <= z.half + u.blockingRadius() * 0.5) u.stuck = Math.max(u.stuck || 0, z.def.sticky);
      }
      return;
    }
    const lava = z.type === "lava";
    for (let i = 0; i < 18; i++) {
      Effects.spawn(lava ? "drop" : "smoke", z.x + rand(-z.half * 0.5, z.half * 0.5), ground - 6, rand(-60, 60), rand(-380, -200), rand(0.6, 1.1), lava ? rand(2.5, 4.5) : rand(6, 10), lava ? "#ff7a28" : WHITE);
    }
    audio.play(lava ? "tank_destroyed" : "egg_splat");
    for (const u of game.living()) {
      if (this.isGround(u) && Math.abs(u.x - z.x) <= z.half + u.blockingRadius() * 0.5) game.damageUnit(u, 1);
    }
  },

  draw(game) {
    for (const z of this.zones) {
      const ground = game.terrain.yAt(z.x);
      const left = z.x - z.half;
      const right = z.x + z.half;
      ctx.save();
      if (z.type === "ice") {
        ctx.strokeStyle = "rgba(120,190,255,0.9)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let x = left; x <= right; x += 6) ctx.lineTo(x, game.terrain.yAt(x) - 1);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        for (let x = left + 10; x < right - 10; x += 26) {
          const y = game.terrain.yAt(x) - 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 10, y - 1);
          ctx.stroke();
        }
      } else if (z.type === "vines") {
        // A tangle of vines on the ground that whips up when it strikes.
        const up = Math.max(z.flash / 0.6, z.timer < z.def.warn ? 0.3 : 0.1);
        ctx.strokeStyle = "#3f8f3a";
        ctx.lineWidth = 3;
        for (let k = 0; k < 5; k++) {
          const vx = z.x - z.half * 0.8 + (k * z.half * 1.6) / 4;
          ctx.beginPath();
          ctx.moveTo(vx, ground);
          ctx.quadraticCurveTo(vx + 10, ground - 18 * up, vx + Math.sin(performance.now() * 0.004 + k) * 6, ground - 30 * up);
          ctx.stroke();
        }
        ctx.fillStyle = "#5cb85c";
        ctx.beginPath();
        ctx.ellipse(z.x, ground, z.half * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (z.type === "grave") {
        // A mound of fresh dirt; bony hands poke out when it erupts.
        ctx.fillStyle = "rgba(90,70,60,0.6)";
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(z.x, ground, z.half * 0.75, 7, 0, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        const warn = z.timer < z.def.warn;
        const up = Math.max(z.flash / 0.6, warn ? 0.25 : 0);
        if (up > 0) {
          for (const hx of [-0.35, 0.3]) {
            const bx = z.x + hx * z.half;
            line(bx, ground, bx, ground - 16 * up, "#eeeae0", 3);
            for (let f = -1; f <= 1; f++) line(bx, ground - 16 * up, bx + f * 3, ground - 21 * up, "#eeeae0", 2);
          }
        }
      } else if (z.type === "warp") {
        // A glowing pad with rings rising off it.
        const glow = 0.5 + 0.5 * Math.sin(performance.now() * 0.005) + z.flash;
        ctx.fillStyle = `rgba(179,108,240,${Math.min(0.9, 0.35 + glow * 0.3).toFixed(3)})`;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(z.x, ground, z.half, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "rgba(179,108,240,0.6)";
        const k = (performance.now() * 0.001) % 1;
        for (const off of [0, 0.5]) {
          const f = (k + off) % 1;
          ctx.globalAlpha = 1 - f;
          ctx.beginPath();
          ctx.ellipse(z.x, ground - f * 34, z.half * (1 - f * 0.4), 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (z.type === "tide") {
        ctx.fillStyle = "rgba(110,180,230,0.55)";
        ctx.strokeStyle = rgbaFromHex(LINE, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(left, game.terrain.yAt(left));
        for (let x = left; x <= right; x += 6) ctx.lineTo(x, game.terrain.yAt(x) - 1 + Math.sin(x * 0.15 + performance.now() * 0.003) * 1.5);
        for (let x = right; x >= left; x -= 6) ctx.lineTo(x, game.terrain.yAt(x) + 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (z.type === "mud" || z.type === "tar") {
        ctx.fillStyle = z.type === "tar" ? "rgba(30,25,25,0.78)" : "rgba(95,70,40,0.6)";
        ctx.strokeStyle = rgbaFromHex(LINE, 0.55);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(left, game.terrain.yAt(left));
        for (let x = left; x <= right; x += 6) ctx.lineTo(x, game.terrain.yAt(x) + 1);
        for (let x = right; x >= left; x -= 6) ctx.lineTo(x, game.terrain.yAt(x) + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const t = performance.now() * 0.002;
        for (let i = 0; i < 3; i++) {
          const bx = left + ((i + 0.5) / 3) * (right - left);
          const r = 2 + ((t + i) % 1) * 3;
          ctx.beginPath();
          ctx.arc(bx, game.terrain.yAt(bx) - r * 0.5, r, Math.PI, 0);
          ctx.stroke();
        }
      } else if (z.type === "syrup") {
        const hot = z.timer < z.def.warn || z.flash > 0;
        ctx.fillStyle = hot ? "rgba(230,150,50,0.85)" : "rgba(210,140,60,0.55)";
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(z.x, ground, z.half * 0.6, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (z.type === "sand") {
        ctx.fillStyle = "rgba(190,140,70,0.45)";
        ctx.strokeStyle = rgbaFromHex(LINE, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(left, game.terrain.yAt(left));
        for (let x = left; x <= right; x += 6) ctx.lineTo(x, game.terrain.yAt(x) + 2);
        for (let x = right; x >= left; x -= 6) ctx.lineTo(x, game.terrain.yAt(x) + 12 + Math.sin(x * 0.2 + performance.now() * 0.002) * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (z.type === "lava") {
        const glow = 0.4 + 0.3 * Math.sin(performance.now() * 0.006) + (z.timer < z.def.warn ? 0.4 : 0) + z.flash;
        ctx.fillStyle = `rgba(255,110,30,${Math.min(1, glow).toFixed(2)})`;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(z.x, ground + 2, z.half * 0.55, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Vent cone.
        ctx.beginPath();
        ctx.moveTo(z.x - z.half, ground + 4);
        ctx.lineTo(z.x - z.half * 0.55, ground - 6);
        ctx.moveTo(z.x + z.half * 0.55, ground - 6);
        ctx.lineTo(z.x + z.half, ground + 4);
        ctx.stroke();
      } else if (z.type === "geyser") {
        const hot = z.timer < z.def.warn || z.flash > 0;
        ctx.fillStyle = hot ? "rgba(255,120,60,0.6)" : rgbaFromHex(LINE, 0.25);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(z.x, ground - 2, z.half * 0.7, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        line(z.x + z.half * 0.7, ground - 2, z.x + z.half * 1.25, ground - 8, LINE, 4);
      }
      ctx.restore();
    }
  },
};

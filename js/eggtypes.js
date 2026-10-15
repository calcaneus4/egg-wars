"use strict";

// Egg types, defined as data. Every Egg has a `kind` (an entry of EGG_TYPES); the game reads
// these fields when the egg flies, hits a unit or lands. New egg types only need an entry here
// (plus an unlock row in js/unlocks.js) unless they need brand-new behaviour.
//
//   damage      hits dealt to a unit on a direct hit
//   burst       number of small eggs thrown out on impact (on top of an egg's own `burst`)
//   split       { count, after, spread, childKind, childBurst } - splits in mid-air
//   band        colour of the stripe drawn on the egg (null = plain)
//   yolkDrop    true if the player can pick it for the Yolk Drop
//   bounces     times it hops off the ground before splatting (bursting `bounceBurst` each hop)
//   sticky      seconds a hit unit stays glued (moves and fires at STICKY_SLOW speed)
//   burstKind   egg kind of the small eggs thrown out by its burst
//   homing      { speed, turn, life } - steers toward the nearest enemy (aircraft first) for
//               `life` seconds, ignoring gravity, then falls normally
//   yolkCount   how many eggs one Yolk Drop releases (default 1)
//   explode     { radius, depth } - blast hits every enemy in range (2 hits near the centre,
//               1 at the edge) and digs a crater of that depth into the terrain
//   freeze      seconds a hit unit is frozen solid (can't move or fire; bosses for a third as long)
//   zap         { range, hops } - on impact, lightning jumps to the nearest enemy within range,
//               then on to `hops` more, 1 hit each
//   smoke       { radius, life } - leaves a smoke cloud; units inside shoot wildly
//   popcorn     { pops, kernels, every } - after landing it pops `pops` times, throwing kernels
//   radiusScale size of the egg relative to a normal one
//   magnet      { radius, pull, life } - after impact, drags light enemy ground units toward it

const STICKY_SLOW = 0.35;
const BOSS_FREEZE_SCALE = 1 / 3;
const SMOKE_SPREAD = 240;

const EGG_TYPES = {
  normal: {
    id: "normal",
    name: "Classic",
    desc: "One big egg that bursts into 8 on impact.",
    level: 1,
    damage: 1,
    burst: 0,
    band: null,
    yolkDrop: true,
    yolkBurst: 8,
  },
  cluster: {
    id: "cluster",
    name: "Cluster",
    desc: "Splits into 6 eggs in mid-air that pepper a wide area.",
    level: 4,
    damage: 1,
    burst: 0,
    band: "cluster",
    yolkDrop: true,
    yolkBurst: 0,
    split: { count: 6, after: 0.55, spread: 150, childKind: "normal", childBurst: 2 },
  },
  bouncing: {
    id: "bouncing",
    name: "Bouncer",
    desc: "Hops along the ground toward the enemy, bursting on every bounce.",
    level: 7,
    damage: 1,
    burst: 0,
    band: "bouncing",
    yolkDrop: true,
    yolkBurst: 3,
    dropVx: 150,
    bounces: 3,
    bounceBurst: 2,
  },
  sticky: {
    id: "sticky",
    name: "Sticky",
    desc: "Gooey burst that glues enemies: they move and fire at a third of their speed for 3 s.",
    level: 10,
    damage: 1,
    burst: 0,
    band: "sticky",
    yolkDrop: true,
    yolkBurst: 8,
    burstKind: "sticky",
    sticky: 3,
  },
  explosive: {
    id: "explosive",
    name: "Boomer",
    desc: "Blasts everything nearby and digs a crater into the ground.",
    level: 14,
    damage: 2,
    burst: 0,
    band: "explosive",
    yolkDrop: true,
    yolkBurst: 3,
    explode: { radius: 95, depth: 34 },
  },
  homing: {
    id: "homing",
    name: "Seeker",
    desc: "Four slow seeker eggs that hunt the nearest enemy - aircraft first.",
    level: 18,
    damage: 2,
    burst: 0,
    band: "homing",
    yolkDrop: true,
    yolkBurst: 1,
    yolkCount: 4,
    homing: { speed: 190, turn: 3.2, life: 4.5 },
  },
  frost: {
    id: "frost",
    name: "Frost",
    desc: "Icy burst that freezes enemies solid for 2.5 s.",
    level: 9,
    damage: 1,
    burst: 0,
    band: "frost",
    yolkDrop: true,
    yolkBurst: 6,
    burstKind: "frostShard",
    freeze: 2.5,
    freezeRadius: 150,
  },
  frostShard: {
    id: "frostShard",
    name: "Frost shard",
    level: 99,
    damage: 1,
    burst: 0,
    band: "frost",
    yolkDrop: false,
    freeze: 1.5,
  },
  bubble: {
    id: "bubble",
    name: "Bubble",
    desc: "Traps up to 4 enemies in floating bubbles; they drop with a bump when the bubbles pop.",
    level: 19,
    damage: 1,
    burst: 0,
    band: "bubble",
    yolkDrop: true,
    yolkBurst: 0,
    bubble: { radius: 140, max: 4, life: 3.5 },
  },
  magnet: {
    id: "magnet",
    name: "Magnet",
    desc: "Pulls nearby enemy troops into a clump for 2.5 s - follow up with a big egg!",
    level: 16,
    damage: 1,
    burst: 0,
    band: "magnet",
    yolkDrop: true,
    yolkBurst: 0,
    magnet: { radius: 360, pull: 170, life: 2.5 },
  },
  popcorn: {
    id: "popcorn",
    name: "Popcorn",
    desc: "Lands with a sizzle, then pops three times, spraying hot kernels all around.",
    level: 11,
    damage: 1,
    burst: 0,
    band: "popcorn",
    yolkDrop: true,
    yolkBurst: 0,
    popcorn: { pops: 3, kernels: 5, every: 0.45 },
  },
  toast: {
    id: "toast",
    name: "Toast",
    level: 99,
    damage: 1,
    burst: 3,
    band: "toast",
    yolkDrop: false,
    radiusScale: 1.3,
  },
  waffle: {
    id: "waffle",
    name: "Waffle",
    level: 99,
    damage: 1,
    burst: 2,
    band: "waffle",
    yolkDrop: false,
    radiusScale: 1.3,
  },
  kernel: {
    id: "kernel",
    name: "Kernel",
    level: 99,
    damage: 1,
    burst: 0,
    band: "kernel",
    yolkDrop: false,
    radiusScale: 0.7,
    noSplat: true,
  },
  zapShard: {
    id: "zapShard",
    name: "Zap shard",
    level: 99,
    damage: 1,
    burst: 0,
    band: "zapper",
    yolkDrop: false,
    zap: { range: 200, hops: 1 },
  },
  smoke: {
    id: "smoke",
    name: "Smoke",
    desc: "Leaves a thick smoke cloud for 7 s: units inside can't aim.",
    level: 13,
    damage: 1,
    burst: 0,
    band: "smoke",
    yolkDrop: true,
    yolkBurst: 3,
    smoke: { radius: 150, life: 7 },
  },
  zapper: {
    id: "zapper",
    name: "Zapper",
    desc: "Lightning jumps from where it lands through up to 4 enemies.",
    level: 15,
    damage: 1,
    burst: 0,
    band: "zapper",
    yolkDrop: true,
    yolkBurst: 0,
    zap: { range: 260, hops: 3 },
  },
};

const EggTypes = {
  // This stage's Yolk Drop eggs (set by js/kit.js); null offers every unlocked egg.
  kit: null,
  clouds: [],
  zaps: [],
  poppers: [],
  magnets: [],
  bubbles: [],

  reset() {
    for (const b of this.bubbles || []) if (!b.u.dead) Events.release(b.u, 0);
    this.bubbles = [];
    this.magnets = [];
    this.clouds = [];
    this.zaps = [];
    this.poppers = [];
  },

  // Called whenever an egg hits a unit or the ground, for the on-impact extras.
  onImpact(game, egg, x, y, target = null) {
    const k = egg.kind;
    if (target && k.freeze && !target.dead) this.freeze(target, k.freeze);
    if (k.freezeRadius && !egg.froze) {
      // Icy splash: everything nearby in the other army freezes too.
      egg.froze = true;
      const r = s(k.freezeRadius);
      for (const u of game.living(-egg.side)) if (dist(u.x, u.y, x, y) <= r + u.radius()) this.freeze(u, k.freeze);
      Effects.spawn("ring", x, y, 0, 0, 0.4, r * 0.5, "#8fd0f5");
      for (let i = 0; i < 10; i++) Effects.spawn("spark", x, y, rand(-160, 160), rand(-200, -40), 0.35, 6, "#8fd0f5");
      audio.play("freeze");
    }
    if (k.smoke && !egg.smoked) {
      egg.smoked = true;
      this.clouds.push({ x, y: Math.min(y, game.terrain.yAt(clamp(x, 0, W))), r: s(k.smoke.radius), life: k.smoke.life, age: 0, puffs: Array.from({ length: 9 }, () => ({ dx: rand(-1, 1), dy: rand(-0.6, 0.2), r: rand(0.35, 0.6), p: rand(0, 6) })) });
      audio.play("egg_splat");
    }
    if (k.bubble && !egg.bubbled) {
      egg.bubbled = true;
      const r = s(k.bubble.radius);
      const ground = game.terrain.yAt(clamp(x, 0, W));
      const caught = game.living(-egg.side)
        .filter((u) => Hazards.isGround(u) && !u.isBoss && !u.heavy && !(u instanceof Tank) && !u.airborne && Math.abs(u.x - x) < r)
        .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))
        .slice(0, k.bubble.max);
      for (const u of caught) {
        u.caughtBy = "bubble";
        u.airborne = true;
        this.bubbles.push({ u, life: k.bubble.life, bob: rand(0, 6) });
      }
      Effects.spawn("ring", x, ground, 0, 0, 0.4, r * 0.4, "#9fd8ff");
      audio.play("pop");
    }
    if (k.magnet && !egg.magnetized) {
      egg.magnetized = true;
      // The magnet always plants itself in the ground below the impact.
      this.magnets.push({ x, y: game.terrain.yAt(clamp(x, 0, W)), side: egg.side, life: k.magnet.life, def: k.magnet, game });
      audio.play("zap");
    }
    if (k.popcorn && !egg.popped) {
      egg.popped = true;
      this.poppers.push({ x, y: Math.min(y, game.terrain.yAt(clamp(x, 0, W))), side: egg.side, source: egg.source, left: k.popcorn.pops, timer: k.popcorn.every, def: k.popcorn, game });
    }
    if (k.zap && !egg.zapped) {
      egg.zapped = true;
      this.zap(game, egg, x, y, target);
    }
  },

  freeze(u, seconds) {
    if (u.side === LEFT && !(u.frozen > 0)) Stats.add("enemiesFrozen");
    u.frozen = Math.max(u.frozen || 0, u.isBoss ? seconds * BOSS_FREEZE_SCALE : seconds);
  },

  // `first` is a unit the egg already hit directly: the chain starts from it instead.
  zap(game, egg, x, y, first = null) {
    const enemies = game.living(-egg.side);
    const hit = first ? [first] : [];
    let from = [x, y];
    const range = s(egg.kind.zap.range);
    for (let i = 0; i <= egg.kind.zap.hops; i++) {
      let best = null;
      for (const u of enemies) {
        if (hit.includes(u) || u.dead) continue;
        const d = dist(from[0], from[1], u.x, u.y);
        if (d <= range && (!best || d < best.d)) best = { u, d };
      }
      if (!best) break;
      const to = [best.u.x, best.u.y - best.u.size * 0.3];
      this.zaps.push({ from, to, life: 0.3, seed: Math.random() * 1000 });
      hit.push(best.u);
      game.damageUnit(best.u, 1, egg.source);
      from = to;
    }
    if (hit.length) audio.play("zap");
    Effects.sparks(x, y, 6, YOLK);
  },

  // Units standing in a smoke cloud fire wild.
  inSmoke(u) {
    return this.clouds.some((c) => Math.abs(u.x - c.x) < c.r && Math.abs(u.y - c.y) < c.r);
  },

  // Random aim error (px) for a unit firing from inside a smoke cloud.
  aimError(u) {
    return this.clouds.length && this.inSmoke(u) ? rand(-s(SMOKE_SPREAD), s(SMOKE_SPREAD)) : 0;
  },

  update(dt) {
    for (const b of this.bubbles) {
      b.life -= dt;
      b.bob += dt;
      if (b.u.dead) continue;
      b.u.lift = Math.min(s(90), (b.u.lift || 0) + s(70) * dt) + Math.sin(b.bob * 3) * 0.5;
      if (b.life <= 0) {
        Effects.spawn("ring", b.u.x, b.u.y, 0, 0, 0.25, 10, "#9fd8ff");
        audio.play("pop");
        Events.release(b.u, 0);
      }
    }
    this.bubbles = this.bubbles.filter((b) => b.life > 0 && !b.u.dead);
    for (const m of this.magnets) {
      m.life -= dt;
      const r = s(m.def.radius);
      for (const u of m.game.living(-m.side)) {
        if (!Hazards.isGround(u) || u.heavy || u.isBoss || u instanceof Tank || u.airborne) continue;
        const dx = m.x - u.x;
        if (Math.abs(dx) > r || Math.abs(dx) < s(8)) continue;
        u.x += Math.sign(dx) * Math.min(Math.abs(dx), s(m.def.pull) * dt);
      }
    }
    this.magnets = this.magnets.filter((m) => m.life > 0);
    for (const pp of this.poppers) {
      if ((pp.timer -= dt) > 0) continue;
      pp.timer = pp.def.every;
      pp.left--;
      for (let i = 0; i < pp.def.kernels; i++) {
        const kernel = new Egg(pp.x, pp.y - s(8), rand(-170, 170), -rand(220, 360), pp.side, 0, "kernel");
        kernel.source = pp.source;
        pp.game.eggs.push(kernel);
      }
      Effects.spawn("ring", pp.x, pp.y - s(6), 0, 0, 0.2, 6, WHITE);
      audio.play("pop");
    }
    this.poppers = this.poppers.filter((pp) => pp.left > 0);
    for (const c of this.clouds) c.age += dt;
    this.clouds = this.clouds.filter((c) => c.age < c.life);
    for (const z of this.zaps) z.life -= dt;
    this.zaps = this.zaps.filter((z) => z.life > 0);
  },

  draw() {
    ctx.save();
    for (const b of this.bubbles) {
      const u = b.u;
      const r = u.radius() * 1.3;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "rgba(170,220,255,0.25)";
      ctx.strokeStyle = "#7cc4f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(u.x, u.y - u.size * 0.2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(u.x - r * 0.3, u.y - u.size * 0.2 - r * 0.35, r * 0.3, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const m of this.magnets) {
      // A horseshoe magnet stuck in the ground with pulsing pull rings.
      const t = m.life * 6;
      ctx.globalAlpha = Math.min(1, m.life * 2);
      ctx.strokeStyle = "rgba(200,60,60,0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const rr = s(m.def.radius) * (((t * 0.15 + i * 0.5) % 1));
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, rr, rr * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#d33";
      ctx.beginPath();
      ctx.arc(m.x, m.y - s(18), s(10), Math.PI, 0);
      ctx.stroke();
      ctx.strokeStyle = "#ccc";
      ctx.beginPath();
      ctx.moveTo(m.x - s(10), m.y - s(18));
      ctx.lineTo(m.x - s(10), m.y - s(8));
      ctx.moveTo(m.x + s(10), m.y - s(18));
      ctx.lineTo(m.x + s(10), m.y - s(8));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const c of this.clouds) {
      const fade = Math.min(1, c.age * 3, (c.life - c.age) / 1.2);
      for (const p of c.puffs) {
        const px = c.x + p.dx * c.r * 0.8 + Math.sin(c.age * 0.8 + p.p) * 6;
        const py = c.y - c.r * 0.35 + p.dy * c.r * 0.6;
        ctx.globalAlpha = 0.8 * fade;
        ctx.fillStyle = "#c9c6c0";
        ctx.strokeStyle = rgbaFromHex(LINE, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, c.r * p.r * Math.min(1, 0.4 + c.age), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    for (const z of this.zaps) {
      ctx.globalAlpha = Math.min(1, z.life * 5);
      const pts = [z.from];
      for (let i = 1; i < 6; i++) {
        const k = i / 6;
        pts.push([z.from[0] + (z.to[0] - z.from[0]) * k + rand(-9, 9), z.from[1] + (z.to[1] - z.from[1]) * k + rand(-9, 9)]);
      }
      pts.push(z.to);
      for (const [w, c] of [[6, YOLK], [2, WHITE]]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  // Ice blocks around frozen units.
  drawIce(units) {
    ctx.save();
    for (const u of units) {
      if (!(u.frozen > 0) || u.dead) continue;
      const r = u.radius() * 1.05;
      ctx.globalAlpha = Math.min(1, u.frozen * 3) * 0.75;
      ctx.fillStyle = "rgba(170,225,255,0.55)";
      ctx.strokeStyle = "#5aa8e0";
      ctx.lineWidth = 2;
      ctx.fillRect(u.x - r, u.y - r * 1.1, r * 2, r * 1.6);
      ctx.strokeRect(u.x - r, u.y - r * 1.1, r * 2, r * 1.6);
      ctx.strokeStyle = WHITE;
      ctx.beginPath();
      ctx.moveTo(u.x - r * 0.6, u.y - r * 0.8);
      ctx.lineTo(u.x - r * 0.2, u.y - r * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  },
  get(id) {
    return EGG_TYPES[id] || EGG_TYPES.normal;
  },

  unlockedYolkDrops(profile) {
    return Object.values(EGG_TYPES).filter((t) => t.yolkDrop && profile.level >= t.level && (!this.kit || this.kit.includes(t.id)));
  },

  // The player's chosen Yolk Drop egg, falling back to Classic if it isn't unlocked.
  selected(profile) {
    const type = EGG_TYPES[profile.yolkEgg];
    return type && type.yolkDrop && profile.level >= type.level && (!this.kit || this.kit.includes(type.id)) ? type : EGG_TYPES.normal;
  },

  cycle(profile, dir = 1) {
    const list = this.unlockedYolkDrops(profile);
    const i = list.indexOf(this.selected(profile));
    profile.yolkEgg = list[(i + dir + list.length) % list.length].id;
  },

  // Turns a homing egg toward its target. `enemies` are the living units of the other army.
  steer(egg, enemies, dt) {
    const h = egg.kind.homing;
    if (!h || egg.age > h.life) {
      egg.noGravity = false;
      return;
    }
    egg.noGravity = true;
    if (!egg.target || egg.target.dead) {
      const air = enemies.filter((u) => u instanceof Airplane);
      const pool = air.length ? air : enemies;
      egg.target = pool.reduce((best, u) => (!best || dist(egg.x, egg.y, u.x, u.y) < dist(egg.x, egg.y, best.x, best.y) ? u : best), null);
    }
    if (!egg.target) return;
    const want = Math.atan2(egg.target.y - egg.y, egg.target.x - egg.x);
    let heading = Math.atan2(egg.vy, egg.vx);
    let diff = want - heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    heading += clamp(diff, -h.turn * dt, h.turn * dt);
    egg.vx = Math.cos(heading) * h.speed;
    egg.vy = Math.sin(heading) * h.speed;
    if (Math.random() < dt * 25) Effects.spawn("smoke", egg.x, egg.y, 0, -10, 0.4, 2.5, LINE);
  },

  // Called every frame for each egg; returns child eggs when the egg splits (the parent is removed).
  maybeSplit(egg) {
    const split = egg.kind.split;
    if (!split || egg.age < split.after) return null;
    const children = [];
    for (let i = 0; i < split.count; i++) {
      const p = split.count > 1 ? i / (split.count - 1) - 0.5 : 0;
      children.push(new Egg(
        egg.x,
        egg.y,
        egg.vx + p * split.spread * 2 + rand(-15, 15),
        egg.vy * 0.6 - rand(20, 70),
        egg.side,
        split.childBurst || 0,
        split.childKind || "normal",
      ));
    }
    for (const child of children) child.source = egg.source;
    Effects.spawn("ring", egg.x, egg.y, 0, 0, 0.25, 8, YOLK);
    Effects.sparks(egg.x, egg.y, 6);
    return children;
  },
};

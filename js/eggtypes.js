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

const STICKY_SLOW = 0.35;

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
};

const EggTypes = {
  get(id) {
    return EGG_TYPES[id] || EGG_TYPES.normal;
  },

  unlockedYolkDrops(profile) {
    return Object.values(EGG_TYPES).filter((t) => t.yolkDrop && profile.level >= t.level);
  },

  // The player's chosen Yolk Drop egg, falling back to Classic if it isn't unlocked.
  selected(profile) {
    const type = EGG_TYPES[profile.yolkEgg];
    return type && type.yolkDrop && profile.level >= type.level ? type : EGG_TYPES.normal;
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

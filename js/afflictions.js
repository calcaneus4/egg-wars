"use strict";

// Affliction events (ROADMAP section 25): a giant bird, chicken pox, a hiccup outbreak and a mole
// invasion. Same rules as every surprise event: at most one per stage, a warning first, both
// armies treated alike, and at most one hit per unit (most of these deal none at all).

const BIRD_LINES = ["Put me DOWN!", "I'm flying!", "Not the talons!", "Bye everyone!"];
const POX_LINES = ["So itchy!", "Don't touch me!", "Spots?!", "Scratch scratch..."];
const HIC_LINES = ["*hic*", "Hic!", "HIC!", "Ex-*hic*-cuse me"];
const MOLE_LINES = ["Whoa, a hole!", "Watch your step!", "Moles?!", "Who dug this?"];
const POX_SECONDS = 6;
const POX_MAX = 14;

function drawBird(x, y, flap, dir) {
  const r = s(40);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.fillStyle = "#8a6a4a";
  // Wings.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, 0);
    ctx.quadraticCurveTo(-r * 0.6, side * r * (0.4 + flap * 0.7), -r * 1.6, side * r * (0.2 + flap * 0.9));
    ctx.quadraticCurveTo(-r * 0.8, side * r * 0.2, r * 0.2, 0);
    ctx.fill();
    ctx.stroke();
  }
  // Body, head and hooked beak.
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.6, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(r * 0.62, -r * 0.08, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = YOLK;
  ctx.beginPath();
  ctx.moveTo(r * 0.78, -r * 0.1);
  ctx.quadraticCurveTo(r * 1.05, -r * 0.05, r * 0.92, r * 0.08);
  ctx.lineTo(r * 0.78, r * 0.02);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(r * 0.68, -r * 0.13, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMole(x, y, up) {
  const r = s(17);
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  // Molehill.
  ctx.fillStyle = "#8a6a4a";
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.6, r * 0.7, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  if (up <= 0) {
    ctx.restore();
    return;
  }
  const my = y - r * 0.6 - up * r * 1.2;
  ctx.fillStyle = "#5a4a40";
  ctx.beginPath();
  ctx.ellipse(x, my, r * 0.75, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2a5a5";
  ctx.beginPath();
  ctx.arc(x, my + r * 0.15, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(x - r * 0.28, my - r * 0.2, 1.4, 0, Math.PI * 2);
  ctx.arc(x + r * 0.28, my - r * 0.2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

Object.assign(EVENT_TYPES, {
  bird: {
    id: "bird",
    name: "GIANT BIRD",
    minStage: 7,
    weight: 1,
    biomes: { desert: 1.5, snow: 1.5, jungle: 2 },
    duration: 25,
    warn: "A huge shadow passes overhead...",
    blurb: "A giant bird swoops in and snatches a trooper from each army!",
    allowed(game) {
      return game.living(RIGHT).length >= 3 && game.living(LEFT).length >= 3;
    },
    start(game, ev) {
      const first = Math.random() < 0.5 ? RIGHT : LEFT;
      ev.order = [first, -first];
      ev.step = 0;
      ev.x = Math.random() < 0.5 ? -s(80) : W + s(80);
      ev.y = H * 0.12;
      ev.state = "hunt";
      ev.flap = 0;
      audio.play("roar");
    },
    pickVictim(game, side) {
      const pool = game.living(side).filter((u) => Hazards.isGround(u) && !u.isBoss && !u.heavy && !(u instanceof Tank) && !u.airborne);
      if (game.living(side).length < 3 || !pool.length) return null;
      return choice(pool);
    },
    update(game, ev, dt) {
      ev.flap = Math.sin(ev.time * 9);
      if (ev.state === "hunt") {
        if (!ev.victim || ev.victim.dead || ev.victim.airborne) ev.victim = ev.step < 2 ? ev.def.pickVictim(game, ev.order[ev.step]) : null;
        if (!ev.victim) {
          if (ev.step < 2) ev.step++;
          else ev.state = "leave";
          return;
        }
        const tx = ev.victim.x;
        const ty = ev.victim.y - s(30);
        const d = Math.max(1, dist(tx, ty, ev.x, ev.y));
        const sp = s(700) * dt;
        ev.dir = Math.sign(tx - ev.x) || 1;
        ev.x += ((tx - ev.x) / d) * Math.min(sp, d);
        ev.y += ((ty - ev.y) / d) * Math.min(sp, d);
        if (d < s(12)) {
          const v = ev.victim;
          v.caughtBy = ev;
          v.airborne = true;
          eventRemark(game, ev, v.x, BIRD_LINES);
          audio.play("roar");
          ev.state = "carry";
        }
      } else if (ev.state === "carry") {
        const v = ev.victim;
        ev.y -= s(260) * dt;
        ev.x += ev.dir * s(180) * dt;
        if (!v.dead) {
          v.x = clamp(ev.x, -s(200), W + s(200));
          v.lift = Math.max(0, game.terrain.yAt(clamp(v.x, 0, W)) - v.groundOffset - (ev.y + s(28)));
        }
        if (ev.y < -s(60)) {
          // Carried off the map: gone without a trace (no kill credit, no wreckage).
          v.dead = true;
          ev.victim = null;
          ev.step++;
          ev.state = ev.step < 2 ? "hunt" : "leave";
          ev.y = -s(40);
        }
      } else {
        ev.y -= s(200) * dt;
        if (ev.y < -s(80)) ev.time = ev.def.duration;
      }
    },
    end(game, ev) {
      if (ev.victim && !ev.victim.dead && ev.victim.caughtBy === ev) Events.release(ev.victim, 0);
    },
    draw(game, ev) {
      // Shadow on the ground, then the bird.
      const gy = game.terrain.yAt(clamp(ev.x, 0, W));
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(ev.x, gy, s(60), s(8), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawBird(ev.x, ev.y, ev.flap, ev.dir || 1);
    },
  },

  pox: {
    id: "pox",
    name: "CHICKEN POX",
    minStage: 6,
    weight: 1,
    biomes: { swamp: 2, jungle: 1.5 },
    duration: 14,
    warn: "Somebody's looking a little spotty...",
    blurb: "Chicken pox! It spreads on contact - itchy troops move and fire at half speed.",
    start(game, ev) {
      // One patient zero in each army.
      for (const side of [RIGHT, LEFT]) {
        const pool = groundTargets(game).filter((u) => u.side === side);
        if (pool.length) choice(pool).itchy = POX_SECONDS;
      }
      ev.check = 0;
      audio.play("event_warn");
    },
    update(game, ev, dt) {
      if ((ev.check -= dt) > 0 || ev.time > ev.def.duration - 3) return;
      ev.check = 0.5;
      const units = groundTargets(game);
      let infected = units.filter((u) => u.itchy > 0).length;
      for (const u of units) {
        if (!(u.itchy > 0) || infected >= POX_MAX) continue;
        for (const o of units) {
          if (o.itchy > 0 || o.poxed || Math.abs(o.x - u.x) > s(36) || Math.random() > 0.5) continue;
          o.itchy = POX_SECONDS;
          o.poxed = true;
          infected++;
          eventRemark(game, ev, o.x, POX_LINES);
        }
      }
    },
    end(game) {
      for (const u of game.units) delete u.poxed;
    },
  },

  hiccups: {
    id: "hiccups",
    name: "HICCUP OUTBREAK",
    minStage: 5,
    weight: 1,
    duration: 12,
    warn: "*hic*",
    blurb: "Everybody's got the hiccups! Every hiccup sends a shot wild.",
    start(game, ev) {
      ev.hiccupers = groundTargets(game).filter(() => Math.random() < 0.45);
      for (const u of ev.hiccupers) u.hicNext = rand(0.3, 1.5);
      ev.pops = [];
    },
    update(game, ev, dt) {
      for (const u of ev.hiccupers) {
        if (u.dead || ev.time > ev.def.duration - 1) continue;
        if ((u.hicNext -= dt) > 0) continue;
        u.hicNext = rand(1, 2.2);
        u.hicWild = true;
        u.hicHop = 0.25;
        ev.pops.push({ x: u.x, y: u.y - u.size, life: 0.7 });
        if (Math.random() < 0.3) audio.play("hic");
        if (Math.random() < 0.15) eventRemark(game, ev, u.x, HIC_LINES);
      }
      for (const p of ev.pops) {
        p.life -= dt;
        p.y -= s(30) * dt;
      }
      ev.pops = ev.pops.filter((p) => p.life > 0);
    },
    end(game, ev) {
      for (const u of ev.hiccupers) {
        u.hicWild = false;
        u.hicHop = 0;
      }
    },
    draw(game, ev) {
      ctx.save();
      ctx.font = "bold 13px Courier New";
      ctx.fillStyle = LINE;
      for (const p of ev.pops) {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillText("hic!", p.x - 12, p.y);
      }
      ctx.restore();
    },
  },

  moles: {
    id: "moles",
    name: "MOLE INVASION",
    minStage: 4,
    weight: 1,
    biomes: { meadow: 2.5, jungle: 1.5 },
    duration: 13,
    warn: "The ground is getting lumpy...",
    blurb: "Moles everywhere! Troops trip in the holes, and moles snack on splats.",
    start(game, ev) {
      ev.hills = Array.from({ length: 8 }, (_, i) => ({ x: W * (0.12 + (0.76 * (i + 0.5)) / 8) + rand(-20, 20), up: 0, next: rand(0.2, 2.5), stay: 0 }));
    },
    update(game, ev, dt) {
      const leaving = ev.time > ev.def.duration - 1.5;
      for (const h of ev.hills) {
        if (h.stay > 0) {
          h.stay -= dt;
          h.up = Math.min(1, h.up + dt * 5);
        } else {
          h.up = Math.max(0, h.up - dt * 4);
          if (!leaving && (h.next -= dt) <= 0) {
            h.stay = rand(1, 2);
            h.next = rand(1.5, 3.5);
            if (Math.random() < 0.3) audio.play("squeak");
          }
        }
        for (const splat of game.splats) if (h.up > 0.5 && Math.abs(splat.x - h.x) < s(14)) splat.age = Math.max(splat.age, 13);
      }
      for (const u of groundTargets(game)) {
        if (u.stagger > 0) continue;
        if (ev.hills.some((h) => Math.abs(h.x - u.x) < s(12))) {
          u.stagger = 0.6;
          if (Math.random() < 0.2) eventRemark(game, ev, u.x, MOLE_LINES);
        }
      }
    },
    draw(game, ev) {
      for (const h of ev.hills) drawMole(h.x, game.terrain.yAt(clamp(h.x, 0, W)), h.up);
    },
  },
});

"use strict";

// Critter events (ROADMAP section 16): goats, bees, frogs and slimes that wander onto the
// battlefield. Like every surprise event they treat both armies the same, and each unit takes at
// most one hit from an event. They join EVENT_TYPES, so the Variety Director picks them too.

const GOAT_LINES = ["MEEEH!", "Hey, no butting!", "Get your own grass!", "Baaa-d goat!"];
const BEE_LINES = ["Ow!", "Bees?!", "Not the face!", "BZZZ-OUCH!"];
const FROG_LINES = ["Ribbit?", "Ew, slimy!", "Watch your step!", "It's raining frogs!"];
const SLIME_LINES = ["Gross!", "It's... wobbling.", "Ew ew ew!", "Splat it!"];

// One remark every so often from a unit near (x, y), so the field doesn't fill with bubbles.
function eventRemark(game, ev, x, lines) {
  if (ev.time < (ev.nextLine || 0)) return;
  const near = game.living().filter((u) => !(u instanceof Airplane) && game.canSpeak(u) && Math.abs(u.x - x) < s(120));
  if (!near.length) return;
  choice(near).say(choice(lines), 1.2);
  ev.nextLine = ev.time + rand(1, 1.8);
}

function groundTargets(game) {
  return game.living().filter((u) => Hazards.isGround(u) && !u.isBoss && !u.airborne);
}

function drawGoat(x, y, dir, phase, charging) {
  const r = s(20);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  const step = Math.sin(phase) * r * 0.35;
  for (const lx of [-r * 0.7, -r * 0.4, r * 0.4, r * 0.7]) line(lx, -r * 0.6, lx + (lx > 0 ? step : -step), 0, LINE, 1.5);
  ctx.fillStyle = "#e3d2b0";
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.0, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Head, lowered when charging.
  const hy = charging ? -r * 0.9 : -r * 1.5;
  ctx.beginPath();
  ctx.ellipse(r * 1.2, hy, r * 0.45, r * 0.35, charging ? 0.5 : 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 1.0, hy - r * 0.25);
  ctx.quadraticCurveTo(r * 0.7, hy - r * 0.9, r * 0.5, hy - r * 0.6);
  ctx.stroke();
  line(r * 1.35, hy + r * 0.3, r * 1.3, hy + r * 0.6, LINE, 1.5);
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(r * 1.3, hy - r * 0.08, 1.4, 0, Math.PI * 2);
  ctx.fill();
  line(-r * 1.05, -r * 1.15, -r * 1.35, -r * 1.35, LINE, 1.5);
  ctx.restore();
}

function drawFrog(x, y, k = 1) {
  const r = s(14) * k;
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  ctx.fillStyle = "#6fbf4a";
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.6, r, r * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (const ex of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.arc(x + ex * r, y - r * 1.2, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(x + ex * r, y - r * 1.2, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSlime(sl, t) {
  const wob = Math.sin(t * 6 + sl.phase) * 0.12;
  const r = s(30) * sl.size * (sl.rise ?? 1);
  if (r <= 0.5) return;
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = sl.flash > 0 ? WHITE : "rgba(110,200,80,0.85)";
  ctx.beginPath();
  ctx.ellipse(sl.x, sl.y - r * (0.7 - wob * 0.5), r * (1 + wob), r * (0.75 - wob), 0, Math.PI, 0);
  ctx.lineTo(sl.x + r * (1 + wob), sl.y);
  ctx.lineTo(sl.x - r * (1 + wob), sl.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const ex of [-0.35, 0.35]) {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(sl.x + ex * r, sl.y - r * 0.85, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(sl.x + ex * r + sl.dir * r * 0.05, sl.y - r * 0.85, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

Object.assign(EVENT_TYPES, {
  goats: {
    id: "goats",
    biomes: { meadow: 2.5, snow: 1.5 },
    name: "GOATS",
    minStage: 5,
    weight: 1,
    duration: 10,
    warn: "Do you hear bleating?",
    blurb: "A herd of goats wanders in and headbutts anyone in the way!",
    start(game, ev) {
      ev.goats = [];
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const fromLeft = i % 2 === 0;
        ev.goats.push({ x: fromLeft ? -s(30) - i * s(40) : W + s(30) + i * s(40), dir: fromLeft ? 1 : -1, phase: rand(0, 6), charge: 0, rest: rand(1, 3) });
      }
      audio.play("bleat");
    },
    update(game, ev, dt) {
      const leaving = ev.time > ev.def.duration - 2.5;
      const targets = groundTargets(game);
      for (const g of ev.goats) {
        g.phase += dt * (g.charge > 0 ? 18 : 8);
        if (leaving) {
          g.dir = g.x < W / 2 ? -1 : 1;
          g.x += g.dir * s(160) * dt;
          continue;
        }
        g.rest -= dt;
        if (g.charge > 0) {
          g.charge -= dt;
          g.x += g.dir * s(230) * dt;
          const hit = targets.find((u) => !u.butted && Math.abs(u.x - g.x) < u.blockingRadius() + s(12));
          if (hit) {
            hit.butted = true;
            hit.x = clamp(hit.x + g.dir * s(55), s(45), W - s(45));
            hit.knock = 0.8;
            hit.knockDir = g.dir;
            g.charge = 0;
            g.rest = rand(1.2, 2.2);
            Effects.spawn("ring", hit.x, hit.y, 0, 0, 0.25, 6, YOLK);
            audio.play("bleat");
            eventRemark(game, ev, hit.x, GOAT_LINES);
          }
        } else {
          g.x += g.dir * s(40) * dt;
          if (g.rest <= 0) {
            // Pick someone nearby to butt.
            const near = targets.filter((u) => !u.butted && Math.abs(u.x - g.x) < s(260));
            const t = near.length ? choice(near) : null;
            if (t) {
              g.dir = Math.sign(t.x - g.x) || 1;
              g.charge = 1.4;
            } else {
              g.rest = rand(0.8, 1.6);
              if (g.x < s(60)) g.dir = 1;
              if (g.x > W - s(60)) g.dir = -1;
            }
          }
        }
        // Goats eat anything, including egg splats.
        for (const splat of game.splats) if (Math.abs(splat.x - g.x) < s(10)) splat.age = Math.max(splat.age, 13);
      }
    },
    end(game) {
      for (const u of game.units) delete u.butted;
    },
    draw(game, ev) {
      for (const g of ev.goats) {
        if (g.x < -s(60) || g.x > W + s(60)) continue;
        drawGoat(g.x, game.terrain.yAt(clamp(g.x, 0, W)), g.dir, g.phase, g.charge > 0);
      }
    },
  },

  bees: {
    id: "bees",
    biomes: { meadow: 2.5, candy: 2.5 },
    name: "BEE SWARM",
    minStage: 7,
    weight: 1,
    duration: 9,
    warn: "Bzzzzz...",
    blurb: "An angry swarm stings whoever it catches - both armies!",
    start(game, ev) {
      ev.x = Math.random() < 0.5 ? -s(40) : W + s(40);
      ev.y = H * 0.45;
      ev.bees = Array.from({ length: 16 }, () => ({ a: rand(0, Math.PI * 2), r: rand(8, 34), sp: rand(4, 9) }));
      ev.nextBuzz = 0;
    },
    update(game, ev, dt) {
      if (ev.time >= ev.nextBuzz) {
        audio.play("buzz");
        ev.nextBuzz = ev.time + 1.4;
      }
      for (const b of ev.bees) b.a += b.sp * dt;
      const leaving = ev.time > ev.def.duration - 2;
      let tx = ev.x < W / 2 ? -s(80) : W + s(80);
      let ty = H * 0.3;
      if (!leaving) {
        const pool = game.living().filter((u) => !u.isBoss && !u.stung && !(u instanceof Castle));
        if (!ev.target || ev.target.dead || ev.target.stung) {
          ev.target = pool.reduce((best, u) => (!best || dist(u.x, u.y, ev.x, ev.y) < dist(best.x, best.y, ev.x, ev.y) ? u : best), null);
        }
        if (ev.target) {
          tx = ev.target.x;
          ty = ev.target.y - ev.target.size * 0.4;
        }
      }
      const d = Math.max(1, dist(tx, ty, ev.x, ev.y));
      const speed = s(leaving ? 320 : 210) * dt;
      ev.x += ((tx - ev.x) / d) * Math.min(speed, d);
      ev.y += ((ty - ev.y) / d) * Math.min(speed, d);
      if (ev.target && !leaving && d < s(18)) {
        const t = ev.target;
        t.stung = true;
        Effects.sparks(t.x, t.y - t.size * 0.3, 4, YOLK);
        game.damageUnit(t, 1);
        eventRemark(game, ev, t.x, BEE_LINES);
        ev.target = null;
      }
    },
    end(game) {
      for (const u of game.units) delete u.stung;
    },
    draw(game, ev) {
      ctx.save();
      ctx.lineWidth = 1;
      for (const b of ev.bees) {
        const bx = ev.x + Math.cos(b.a) * b.r;
        const by = ev.y + Math.sin(b.a * 1.3) * b.r * 0.6;
        ctx.fillStyle = "#ffcf33";
        ctx.strokeStyle = LINE;
        ctx.beginPath();
        ctx.ellipse(bx, by, 5, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = rgbaFromHex(LINE, 0.5);
        ctx.beginPath();
        ctx.ellipse(bx, by - 4.5, 3, 1.8, Math.sin(b.a * 8), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  frogs: {
    id: "frogs",
    biomes: { swamp: 4 },
    name: "FROG PLAGUE",
    minStage: 6,
    weight: 1,
    duration: 10,
    warn: "The sky is... croaking?",
    blurb: "It's raining frogs! Troops trip over them and eggs bounce off.",
    start(game, ev) {
      ev.frogs = Array.from({ length: 16 }, (_, i) => ({ x: rand(W * 0.08, W * 0.92), y: -rand(20, 300) - i * 12, vy: 0, vx: 0, landed: false, hop: rand(0.5, 2), dir: Math.random() < 0.5 ? -1 : 1 }));
      audio.play("croak");
    },
    update(game, ev, dt) {
      const leaving = ev.time > ev.def.duration - 1.5;
      for (const f of ev.frogs) {
        const ground = game.terrain.yAt(clamp(f.x, 0, W));
        if (!f.landed) {
          f.vy += GRAVITY * 0.7 * dt;
          f.y += f.vy * dt;
          f.x += f.vx * dt;
          if (f.y >= ground) {
            f.y = ground;
            f.landed = true;
            f.vx = 0;
            if (Math.random() < 0.3) audio.play("croak");
          }
          continue;
        }
        f.y = ground;
        f.hop -= dt;
        if (f.hop <= 0) {
          f.landed = false;
          f.vy = -rand(160, 240);
          f.vx = f.dir * rand(40, 90) * (leaving ? 3 : 1);
          if (Math.random() < 0.3) f.dir = -f.dir;
          f.hop = rand(0.8, 2);
        }
      }
      // Ground troops trip over frogs; falling eggs bounce off them.
      for (const u of groundTargets(game)) {
        if (ev.frogs.some((f) => f.landed && Math.abs(f.x - u.x) < s(18))) {
          if (!(u.stagger > 0)) eventRemark(game, ev, u.x, FROG_LINES);
          u.stagger = Math.max(u.stagger || 0, 0.5);
        }
      }
      for (const e of game.eggs) {
        if (e.vy <= 0) continue;
        const f = ev.frogs.find((fr) => fr.landed && Math.abs(fr.x - e.x) < s(14) && Math.abs(fr.y - s(12) - e.y) < s(14));
        if (f) {
          e.vy = -Math.abs(e.vy) * 0.6 - 60;
          e.vx *= 0.7;
          f.landed = false;
          f.vy = -200;
          audio.play("croak");
        }
      }
    },
    draw(game, ev) {
      const fade = Math.min(1, (ev.def.duration - ev.time) * 2);
      ctx.save();
      ctx.globalAlpha = fade;
      for (const f of ev.frogs) if (f.y > -20) drawFrog(f.x, f.y, f.landed ? 1 : 0.9);
      ctx.restore();
    },
  },

  slimes: {
    id: "slimes",
    biomes: { swamp: 2.5, candy: 1.5 },
    name: "SLIME MONSTERS",
    minStage: 9,
    weight: 0.8,
    duration: 16,
    warn: "The ground is... bubbling?",
    blurb: "Slimes ooze up and attack whoever is closest - splat them with eggs!",
    start(game, ev) {
      const count = 2 + Math.floor(Math.random() * 2);
      ev.slimes = [];
      for (let i = 0; i < count; i++) {
        const x = W * (0.3 + (0.4 * (i + 0.5)) / count) + rand(-30, 30);
        ev.slimes.push({ x, y: game.terrain.yAt(x), hp: 3, size: rand(0.9, 1.2), phase: rand(0, 6), dir: 1, cool: rand(1, 2), rise: 0, flash: 0 });
      }
      audio.play("slime");
    },
    update(game, ev, dt) {
      const melting = ev.time > ev.def.duration - 1.5;
      const targets = groundTargets(game);
      for (const sl of ev.slimes) {
        sl.flash = Math.max(0, sl.flash - dt);
        sl.rise = melting ? Math.max(0, sl.rise - dt) : Math.min(1, sl.rise + dt);
        if (sl.hp <= 0 || melting) continue;
        const t = targets.reduce((best, u) => (!best || Math.abs(u.x - sl.x) < Math.abs(best.x - sl.x) ? u : best), null);
        if (t) {
          sl.dir = Math.sign(t.x - sl.x) || 1;
          if (Math.abs(t.x - sl.x) > t.blockingRadius() + s(14)) sl.x += sl.dir * s(28) * dt;
          else if ((sl.cool -= dt) <= 0) {
            sl.cool = 2;
            if (!t.slimed) {
              t.slimed = true;
              game.damageUnit(t, 1);
            }
            t.stuck = Math.max(t.stuck || 0, 1.5);
            Effects.spawn("drop", t.x, t.y, rand(-40, 40), -80, 0.5, 3, "#6ec850");
            eventRemark(game, ev, t.x, SLIME_LINES);
          }
        }
        sl.y = game.terrain.yAt(clamp(sl.x, 0, W));
        // Eggs from either army splat the slime.
        const r = s(30) * sl.size;
        for (const e of [...game.eggs]) {
          if (Math.abs(e.x - sl.x) < r && e.y > sl.y - r * 1.4 && e.y < sl.y + 4) {
            game.removeEgg(e);
            sl.hp -= 1;
            sl.flash = 0.15;
            Effects.yolk(e.x, e.y, 4, 0.8);
            if (sl.hp <= 0) {
              for (let i = 0; i < 10; i++) Effects.spawn("drop", sl.x, sl.y - r * 0.5, rand(-160, 160), rand(-260, -80), rand(0.5, 0.9), rand(2.5, 4), "#6ec850");
              audio.play("slime");
              break;
            }
          }
        }
      }
      ev.slimes = ev.slimes.filter((sl) => sl.hp > 0);
    },
    end(game) {
      for (const u of game.units) delete u.slimed;
    },
    draw(game, ev) {
      for (const sl of ev.slimes) drawSlime(sl, ev.time);
    },
  },
});

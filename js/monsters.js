"use strict";

// Monster events (ROADMAP section 19): Sasquatch, panicky tourists, ghosts, a giant snake and a
// rock monster. Same rules as every surprise event: at most one per stage, a warning first, both
// armies treated alike, and at most one hit per unit from the event.

const SQUATCH_LINES = ["Is that... Bigfoot?!", "Put me down, Mr. Foot!", "Nobody will believe this!", "He smells like pine cones!"];
const TOURIST_LINES = ["Cheese!", "Not now, I'm in a war!", "Is this the museum?", "Get my good side!"];
const GHOST_LINES = ["G-g-ghost!", "Nope. Nope. Nope.", "Mommy!", "BOO yourself!"];
const SNAKE_LINES = ["SNAAAKE!", "Why'd it have to be snakes?", "Whoa-oa-oa!", "Hisss-terical!"];
const ROCK_LINES = ["It's a rock... with feet!", "Run!", "Rock and roll!", "Crumble it!"];

function drawSasquatch(x, y, dir, phase, holding) {
  const r = s(40);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.fillStyle = "#7a5233";
  const step = Math.sin(phase) * r * 0.3;
  // Legs.
  line(-r * 0.3, -r * 1.2, -r * 0.3 + step, 0, "#5a3a22", 6);
  line(r * 0.3, -r * 1.2, r * 0.3 - step, 0, "#5a3a22", 6);
  // Shaggy body.
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.9, r * 0.75, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = -2; i <= 2; i++) line(i * r * 0.25, -r * 1.2, i * r * 0.25 + 2, -r * 0.95, LINE, 1.2);
  // Head and face.
  ctx.beginPath();
  ctx.arc(r * 0.25, -r * 3.05, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e0c19a";
  ctx.beginPath();
  ctx.ellipse(r * 0.42, -r * 2.98, r * 0.24, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(r * 0.48, -r * 3.12, 2, 0, Math.PI * 2);
  ctx.fill();
  // Arms: one held up when carrying someone.
  if (holding) line(r * 0.4, -r * 2.4, r * 1.0, -r * 2.9, "#5a3a22", 6);
  else line(r * 0.5, -r * 2.3, r * 0.8 - step, -r * 1.4, "#5a3a22", 6);
  line(-r * 0.5, -r * 2.3, -r * 0.8 + step, -r * 1.4, "#5a3a22", 6);
  ctx.restore();
}

function drawTourist(x, y, dir, phase, k) {
  const r = s(12);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  const step = Math.sin(phase) * r * 0.5;
  line(0, -r * 1.2, -r * 0.4 + step, 0, LINE, 1.5);
  line(0, -r * 1.2, r * 0.4 - step, 0, LINE, 1.5);
  // Loud shirt.
  ctx.fillStyle = ["#ff7eb6", "#4fc3f7", "#ffd54f", "#81c784"][k % 4];
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.7, r * 0.45, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2d0a9";
  ctx.beginPath();
  ctx.arc(0, -r * 2.55, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Sun hat and camera.
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.ellipse(0, -r * 2.85, r * 0.6, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.fillRect(r * 0.35, -r * 1.95, r * 0.45, r * 0.32);
  ctx.restore();
}

function drawBus(x, y, dir) {
  const w = s(120);
  const h = s(46);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.fillStyle = "#ffcc33";
  ctx.beginPath();
  ctx.rect(-w / 2, -h - s(10), w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#bfe6ff";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(-w / 2 + s(8) + i * s(21), -h - s(2), s(15), s(14));
    ctx.strokeRect(-w / 2 + s(8) + i * s(21), -h - s(2), s(15), s(14));
  }
  ctx.fillStyle = LINE;
  ctx.font = `bold ${Math.round(s(14))}px Courier New`;
  ctx.fillText("TOURS", -w / 2 + s(30), -s(18));
  for (const wx of [-w * 0.32, w * 0.32]) {
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(wx, -s(8), s(9), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawGhost(x, y, t, a) {
  const r = s(22);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#fbfbff";
  ctx.strokeStyle = rgbaFromHex(LINE, 0.6);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  for (let i = 0; i <= 6; i++) {
    const wx = x + r - (i / 6) * r * 2;
    ctx.lineTo(wx, y + r * 1.1 + Math.sin(t * 8 + i) * r * 0.15 * (i % 2 ? 1 : -1));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.1, r * 0.13, r * 0.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.35, y - r * 0.1, r * 0.13, r * 0.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x, y + r * 0.4, r * 0.15, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRockMonster(m, t) {
  const r = s(52) * m.rise;
  if (r < 1) return;
  const x = m.x;
  const y = m.y;
  const stomp = m.stomp > 0 ? Math.sin(m.stomp * Math.PI) * s(14) : 0;
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.fillStyle = m.flash > 0 ? WHITE : "#9a948a";
  // Legs and body made of boulders.
  for (const [dx, dy, rr] of [[-0.45, -0.25, 0.32], [0.45, -0.25, 0.32], [0, -1.05, 0.7], [-0.75, -1.15, 0.3], [0.75, -1.15 - stomp / r, 0.3], [0, -1.85, 0.38]]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * r, y + dy * r, rr * r, rr * r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#ffb347";
  ctx.beginPath();
  ctx.arc(x - r * 0.12 + m.dir * r * 0.05, y - r * 1.9, r * 0.07, 0, Math.PI * 2);
  ctx.arc(x + r * 0.14 + m.dir * r * 0.05, y - r * 1.9, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  // Moss.
  ctx.strokeStyle = "#6f9b4a";
  ctx.beginPath();
  ctx.arc(x, y - r * 1.05, r * 0.5, Math.PI * 1.15, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
}

Object.assign(EVENT_TYPES, {
  sasquatch: {
    id: "sasquatch",
    name: "SASQUATCH",
    minStage: 6,
    weight: 1,
    biomes: { snow: 3, meadow: 1.5, swamp: 1.5 },
    duration: 13,
    warn: "Huge footprints in the mud...",
    blurb: "Bigfoot is real! He picks up troops, sniffs them and puts them somewhere else.",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.x = ev.dir > 0 ? -s(60) : W + s(60);
      ev.walk = 0;
      ev.nextGrab = 2;
      audio.play("roar");
    },
    update(game, ev, dt) {
      const walking = !ev.held || ev.holdTimer <= 0;
      if (walking) {
        ev.x += ev.dir * s(70) * dt;
        ev.walk += dt * 6;
      }
      const hx = ev.x + ev.dir * s(30);
      if (ev.held) {
        const u = ev.held;
        ev.holdTimer -= dt;
        u.x = clamp(hx, s(45), W - s(45));
        u.lift = Math.min(s(125), (u.lift || 0) + s(200) * dt);
        if (ev.holdTimer <= -1.2 || u.dead) {
          // Set them down somewhere else entirely.
          if (!u.dead) {
            u.caughtBy = null;
            u.airborne = false;
            u.lift = 0;
            u.spin = 0;
            u.x = clamp(u.x + rand(-s(220), s(220)), s(60), W - s(60));
            Effects.smoke(u.x, u.y, 4);
          }
          ev.held = null;
          ev.nextGrab = ev.time + rand(2.5, 4);
        }
        return;
      }
      if (ev.time < ev.def.duration - 2.5 && ev.time >= ev.nextGrab) {
        const near = groundTargets(game).filter((u) => !u.heavy && !(u instanceof Tank) && Math.abs(u.x - hx) < s(90));
        if (near.length) {
          const u = choice(near);
          u.caughtBy = ev;
          u.airborne = true;
          ev.held = u;
          ev.holdTimer = 1.4;
          eventRemark(game, ev, u.x, SQUATCH_LINES);
          audio.play("roar");
        } else {
          ev.nextGrab = ev.time + 0.5;
        }
      }
    },
    end(game, ev) {
      if (ev.held && !ev.held.dead) {
        ev.held.caughtBy = null;
        ev.held.airborne = false;
        ev.held.lift = 0;
      }
    },
    draw(game, ev) {
      if (ev.x < -s(100) || ev.x > W + s(100)) return;
      drawSasquatch(ev.x, game.terrain.yAt(clamp(ev.x, 0, W)), ev.dir, ev.walk, !!ev.held);
    },
  },

  tourists: {
    id: "tourists",
    name: "PANICKY TOURISTS",
    minStage: 5,
    weight: 1,
    biomes: { beach: 3, desert: 1.5, candy: 1.5 },
    duration: 12,
    warn: "Is that a tour bus?",
    blurb: "Tourists run about snapping photos - troops can't help stopping to pose!",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.busX = ev.dir > 0 ? -s(120) : W + s(120);
      ev.parked = false;
      ev.tourists = [];
      ev.flashes = [];
      audio.play("horn");
    },
    update(game, ev, dt) {
      const leaving = ev.time > ev.def.duration - 2.5;
      if (!ev.parked || leaving) {
        if (leaving && ev.tourists.length) {
          // Everyone back on the bus!
          for (const t of ev.tourists) t.x += Math.sign(ev.busX - t.x) * s(260) * dt;
          ev.tourists = ev.tourists.filter((t) => Math.abs(t.x - ev.busX) > s(10));
        } else {
          ev.busX += ev.dir * s(leaving ? 260 : 220) * dt;
        }
        if (!ev.parked && Math.abs(ev.busX - W / 2) < s(12)) {
          ev.parked = true;
          for (let i = 0; i < 5; i++) ev.tourists.push({ x: ev.busX, dir: i % 2 ? 1 : -1, phase: rand(0, 6), flash: rand(0.8, 2.2), k: i, speed: rand(70, 130) });
        }
      }
      if (!leaving) {
        for (const t of ev.tourists) {
          t.phase += dt * 12;
          t.x += t.dir * s(t.speed) * dt;
          if (Math.abs(t.x - W / 2) > s(280)) t.dir = -Math.sign(t.x - W / 2);
          if ((t.flash -= dt) <= 0) {
            t.flash = rand(1.4, 2.8);
            ev.flashes.push({ x: t.x + t.dir * s(10), y: game.terrain.yAt(clamp(t.x, 0, W)) - s(22), life: 0.25 });
            audio.play("camera");
            for (const u of groundTargets(game)) {
              if (Math.abs(u.x - t.x) < s(80) && !(u.posing > 0)) u.posing = 1.1;
            }
            eventRemark(game, ev, t.x, TOURIST_LINES);
          }
        }
      }
      for (const f of ev.flashes) f.life -= dt;
      ev.flashes = ev.flashes.filter((f) => f.life > 0);
    },
    draw(game, ev) {
      drawBus(ev.busX, game.terrain.yAt(clamp(ev.busX, 0, W)), ev.dir);
      for (const t of ev.tourists) drawTourist(t.x, game.terrain.yAt(clamp(t.x, 0, W)), t.dir, t.phase, t.k);
      ctx.save();
      for (const f of ev.flashes) {
        ctx.globalAlpha = f.life * 4;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = YOLK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const rr = i % 2 ? s(6) : s(18);
          ctx.lineTo(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  ghosts: {
    id: "ghosts",
    name: "GHOSTS",
    minStage: 8,
    weight: 0.8,
    nightWeight: 4,
    biomes: { graveyard: 4, swamp: 1.5 },
    duration: 11,
    warn: "It's suddenly very cold...",
    blurb: "Ghosts drift through the battle - spooked troops turn and run for a moment!",
    start(game, ev) {
      ev.ghosts = Array.from({ length: 4 }, (_, i) => {
        const dir = i % 2 ? -1 : 1;
        return { x: dir > 0 ? -s(40) - i * s(90) : W + s(40) + i * s(90), dir, base: H * (0.55 + Math.random() * 0.12), p: rand(0, 6), speed: rand(90, 130) };
      });
      audio.play("boo");
    },
    update(game, ev, dt) {
      for (const g of ev.ghosts) {
        g.x += g.dir * s(g.speed) * dt;
        g.y = g.base + Math.sin(ev.time * 2 + g.p) * s(30);
      }
      for (const u of groundTargets(game)) {
        if (u.spookedOnce) continue;
        if (ev.ghosts.some((g) => Math.abs(g.x - u.x) < s(26))) {
          u.spookedOnce = true;
          // Heavy vehicles just shiver; everyone else turns tail for a moment.
          if (u.heavy || u instanceof Tank) u.stagger = Math.max(u.stagger || 0, 1);
          else u.spooked = 1.3;
          eventRemark(game, ev, u.x, GHOST_LINES);
        }
      }
      if (Math.random() < dt * 0.6) audio.play("boo");
    },
    end(game) {
      for (const u of game.units) delete u.spookedOnce;
    },
    draw(game, ev) {
      const a = Math.min(0.85, ev.time * 2, (ev.def.duration - ev.time) * 2);
      for (const g of ev.ghosts) drawGhost(g.x, g.y, ev.time + g.p, a);
    },
  },

  snake: {
    id: "snake",
    name: "GIANT SNAKE",
    minStage: 10,
    weight: 1,
    biomes: { desert: 2, swamp: 2.5, beach: 1.5 },
    duration: 9,
    warn: "Sssomething is coming...",
    blurb: "A giant snake slithers through - troops get bumped into the air!",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.len = s(420);
      ev.head = ev.dir > 0 ? -s(20) : W + s(20);
      ev.speed = (W + ev.len + s(60)) / (ev.def.duration - 0.5);
      audio.play("hiss");
    },
    update(game, ev, dt) {
      ev.head += ev.dir * ev.speed * dt;
      for (const u of groundTargets(game)) {
        if (u.snaked || Math.abs(u.x - ev.head) > s(26)) continue;
        u.snaked = true;
        if (u.heavy || u instanceof Tank) {
          u.stagger = Math.max(u.stagger || 0, 0.8);
          continue;
        }
        // Bumped up and over the snake; the landing costs one hit.
        u.airborne = true;
        u.liftV = rand(240, 320);
        u.lift = u.lift || 0;
        u.flingVx = ev.dir * rand(30, 70);
        eventRemark(game, ev, u.x, SNAKE_LINES);
      }
    },
    end(game) {
      for (const u of game.units) delete u.snaked;
    },
    draw(game, ev) {
      const segs = 22;
      ctx.save();
      ctx.lineCap = "round";
      for (const [w, c] of [[s(26), LINE], [s(21), "#7cae4a"]]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        for (let i = 0; i <= segs; i++) {
          const x = ev.head - ev.dir * (i / segs) * ev.len;
          const y = game.terrain.yAt(clamp(x, 0, W)) - s(10) - Math.abs(Math.sin(ev.time * 6 - i * 0.6)) * s(14) * (1 - i / segs * 0.5);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      // Diamond markings.
      ctx.fillStyle = "#4e7a2c";
      for (let i = 2; i < segs; i += 2) {
        const x = ev.head - ev.dir * (i / segs) * ev.len;
        const y = game.terrain.yAt(clamp(x, 0, W)) - s(10) - Math.abs(Math.sin(ev.time * 6 - i * 0.6)) * s(14) * (1 - i / segs * 0.5);
        ctx.beginPath();
        ctx.ellipse(x, y, s(5), s(4), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Head with eyes and a flicking tongue.
      const hy = game.terrain.yAt(clamp(ev.head, 0, W)) - s(18);
      ctx.fillStyle = "#7cae4a";
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ev.head, hy, s(22), s(15), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = YOLK;
      ctx.beginPath();
      ctx.arc(ev.head + ev.dir * s(8), hy - s(6), s(4), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (Math.sin(ev.time * 14) > 0) {
        const tx = ev.head + ev.dir * s(22);
        line(tx, hy + s(3), tx + ev.dir * s(14), hy + s(3), RED, 2);
        line(tx + ev.dir * s(14), hy + s(3), tx + ev.dir * s(19), hy - s(1), RED, 2);
        line(tx + ev.dir * s(14), hy + s(3), tx + ev.dir * s(19), hy + s(7), RED, 2);
      }
      ctx.restore();
    },
  },

  rockMonster: {
    id: "rockMonster",
    name: "ROCK MONSTER",
    minStage: 12,
    weight: 0.8,
    biomes: { volcano: 3, snow: 1.5, desert: 1.2 },
    duration: 18,
    warn: "The rocks are... moving?",
    blurb: "A rock monster stomps the nearest troops - crumble it with eggs!",
    start(game, ev) {
      const x = W * rand(0.38, 0.62);
      ev.monster = { x, y: game.terrain.yAt(x), hp: 8 + Math.floor(game.stage / 6), rise: 0, dir: 1, cool: 2, stomp: 0, flash: 0 };
      audio.play("roar");
    },
    update(game, ev, dt) {
      const m = ev.monster;
      if (!m) return;
      const crumbling = ev.time > ev.def.duration - 1.5;
      m.rise = crumbling ? Math.max(0, m.rise - dt) : Math.min(1, m.rise + dt * 0.8);
      m.flash = Math.max(0, m.flash - dt);
      m.stomp = Math.max(0, m.stomp - dt * 2);
      if (crumbling || m.rise < 1) return;
      const targets = groundTargets(game);
      const t = targets.reduce((best, u) => (!best || Math.abs(u.x - m.x) < Math.abs(best.x - m.x) ? u : best), null);
      if (t) {
        m.dir = Math.sign(t.x - m.x) || 1;
        if (Math.abs(t.x - m.x) > s(50)) m.x += m.dir * s(22) * dt;
        else if ((m.cool -= dt) <= 0) {
          m.cool = 2.6;
          m.stomp = 1;
          Effects.shake(5);
          Effects.debris(m.x, m.y, 6, LINE);
          audio.play("tank_destroyed");
          for (const u of targets) {
            if (Math.abs(u.x - m.x) > s(70)) continue;
            u.stagger = Math.max(u.stagger || 0, 0.8);
            if (!u.stomped) {
              u.stomped = true;
              game.damageUnit(u, 1);
            }
          }
          eventRemark(game, ev, m.x, ROCK_LINES);
        }
      }
      m.y = game.terrain.yAt(clamp(m.x, 0, W));
      const r = s(52);
      for (const e of [...game.eggs]) {
        if (Math.abs(e.x - m.x) < r * 0.9 && e.y > m.y - r * 2.2 && e.y < m.y + 4) {
          game.removeEgg(e);
          m.hp -= 1;
          m.flash = 0.12;
          Effects.debris(e.x, e.y, 2, "#9a948a");
          if (m.hp <= 0) {
            Effects.debris(m.x, m.y - r, 14, "#9a948a");
            Effects.smoke(m.x, m.y - r, 6, 2);
            audio.play("tank_destroyed");
            ev.monster = null;
            break;
          }
        }
      }
    },
    end(game) {
      for (const u of game.units) delete u.stomped;
    },
    draw(game, ev) {
      if (ev.monster) drawRockMonster(ev.monster, ev.time);
    },
  },
});

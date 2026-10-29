"use strict";

// Visitor events (ROADMAP section 31): an alien landing, a mystery green army, an egg storm and a
// hungry squirrel. Same rules as every surprise event: at most one per stage, a warning first,
// both armies treated alike, and at most one hit per unit. These events keep their own
// projectiles, so the game's two-sided egg logic is untouched.

const ALIEN_LINES = ["Take me to your leader!", "Bleep bloop!", "Zap zap!", "Earthlings!"];
const ALIEN_VICTIM_LINES = ["Little green men!", "They zapped me!", "ALIENS!", "Not again!"];
const GREEN_LINES = ["Who ARE those guys?", "Green army?!", "Whose side are they on?", "Not ours!"];
const STORM_LINES = ["It's raining eggs!", "Take cover!", "Incoming!", "Hallelujah!"];
const SQUIRREL_LINES = ["Hey, that was my egg!", "A squirrel?!", "It ate my shot!", "Give it back!"];
const GREEN = "#3e9e48";

// Gives `u` its one hit from this event, if it hasn't had it yet.
function visitorHit(game, ev, u) {
  if (u.dead || u.isBoss || ev.hit.has(u)) return false;
  ev.hit.add(u);
  game.damageUnit(u, 1);
  return true;
}

function drawAlien(x, y, dir, phase) {
  const r = s(24);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  const step = Math.sin(phase) * r * 0.3;
  line(-r * 0.25, -r * 0.6, -r * 0.3 + step, 0, LINE, 1.5);
  line(r * 0.25, -r * 0.6, r * 0.3 - step, 0, LINE, 1.5);
  ctx.fillStyle = "#7fd36a";
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.95, r * 0.35, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Big head with antennae and black eyes.
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.85, r * 0.6, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  line(-r * 0.25, -r * 2.3, -r * 0.45, -r * 2.75, LINE, 1.2);
  line(r * 0.25, -r * 2.3, r * 0.45, -r * 2.75, LINE, 1.2);
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.ellipse(r * 0.05, -r * 1.85, r * 0.16, r * 0.24, 0.3, 0, Math.PI * 2);
  ctx.ellipse(r * 0.38, -r * 1.85, r * 0.12, r * 0.2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Ray gun.
  line(r * 0.2, -r * 1.0, r * 0.75, -r * 1.1, "#9aa3ad", 3);
  ctx.restore();
}

function drawGreenTrooper(t, ground) {
  const x = t.x;
  const y = ground - t.lift;
  ctx.save();
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2;
  const step = Math.sin(t.phase) * s(5);
  line(x, y - s(14), x - s(5) + step, y, GREEN, 2);
  line(x, y - s(14), x + s(5) - step, y, GREEN, 2);
  line(x, y - s(14), x, y - s(30), GREEN, 2);
  line(x, y - s(26), x + t.dir * s(10), y - s(30), GREEN, 2);
  ctx.fillStyle = "rgba(62,158,72,0.35)";
  ctx.beginPath();
  ctx.arc(x, y - s(36), s(6), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Helmet with a question mark: nobody knows who they are.
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(x, y - s(38), s(7), Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = "bold 9px Courier New";
  ctx.fillText("?", x - 3, y - s(40));
  if (t.lift > 0) {
    // Parachute on the way in.
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    ctx.fillStyle = "#cfe8c8";
    ctx.beginPath();
    ctx.arc(x, y - s(70), s(18), Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    line(x - s(18), y - s(70), x, y - s(42), LINE, 1);
    line(x + s(18), y - s(70), x, y - s(42), LINE, 1);
  }
  ctx.restore();
}

function drawSquirrel(x, y, dir, phase, cheeks) {
  const r = s(50);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.8;
  ctx.fillStyle = "#b5703a";
  // Big bushy tail curling up behind.
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.4);
  ctx.bezierCurveTo(-r * 1.6, -r * 0.3, -r * 1.5, -r * 1.8, -r * 0.7, -r * 1.7);
  ctx.bezierCurveTo(-r * 1.1, -r * 1.3, -r * 0.9, -r * 0.8, -r * 0.3, -r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Body, legs and head with puffed-out cheeks.
  const step = Math.sin(phase) * r * 0.25;
  line(-r * 0.3, -r * 0.3, -r * 0.4 + step, 0, LINE, 2);
  line(r * 0.25, -r * 0.3, r * 0.35 - step, 0, LINE, 2);
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.55, r * 0.55, r * 0.38, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.55, -r * 0.95, r * (0.3 + Math.min(0.15, cheeks * 0.02)), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.45, -r * 1.2);
  ctx.lineTo(r * 0.5, -r * 1.45);
  ctx.lineTo(r * 0.62, -r * 1.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(r * 0.66, -r * 1.02, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.fillRect(r * 0.78, -r * 0.88, r * 0.08, r * 0.12);
  ctx.restore();
}

Object.assign(EVENT_TYPES, {
  aliens: {
    id: "aliens",
    name: "ALIEN LANDING",
    minStage: 10,
    weight: 0.9,
    biomes: { alien: 3, moon: 2, desert: 1.3 },
    nightWeight: 1.5,
    duration: 22,
    warn: "A flying saucer is coming in to land...",
    blurb: "Little green aliens zap troops on both sides - one zap each!",
    start(game, ev) {
      ev.x = rand(W * 0.4, W * 0.6);
      ev.y = -s(60);
      ev.state = "land";
      ev.aliens = [];
      ev.beams = [];
      ev.hit = new Set();
      audio.play("ufo");
    },
    update(game, ev, dt) {
      const ground = game.terrain.yAt(ev.x);
      if (ev.state === "land") {
        ev.y = Math.min(ground - s(28), ev.y + s(220) * dt);
        if (ev.y >= ground - s(28)) {
          ev.state = "out";
          ev.aliens = [-1, -1, 1, 1].map((dir, i) => ({ x: ev.x, dir, phase: rand(0, 6), walk: rand(s(90), s(160)) + i * s(25), next: rand(1, 2) }));
          eventRemark(game, ev, ev.x, ALIEN_LINES);
        }
      } else if (ev.state === "out") {
        for (const a of ev.aliens) {
          if (Math.abs(a.x - ev.x) < a.walk) {
            a.x += a.dir * s(45) * dt;
            a.phase += dt * 10;
          }
          if ((a.next -= dt) > 0) continue;
          a.next = rand(2, 3);
          const ay = game.terrain.yAt(clamp(a.x, 0, W)) - s(20);
          const t = groundTargets(game).filter((u) => !ev.hit.has(u) && Math.abs(u.x - a.x) < s(260)).sort((p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x))[0];
          if (!t) continue;
          a.dir = Math.sign(t.x - a.x) || a.dir;
          ev.beams.push({ x1: a.x + a.dir * s(12), y1: ay, x2: t.x, y2: t.y, life: 0.25 });
          audio.play("zap");
          if (visitorHit(game, ev, t)) eventRemark(game, ev, t.x, ALIEN_VICTIM_LINES);
        }
        if (ev.time > ev.def.duration - 7) ev.state = "back";
      } else if (ev.state === "back") {
        for (const a of ev.aliens) {
          a.dir = Math.sign(ev.x - a.x) || 1;
          a.x += a.dir * s(70) * dt;
          a.phase += dt * 12;
        }
        ev.aliens = ev.aliens.filter((a) => Math.abs(a.x - ev.x) > s(8));
        if (!ev.aliens.length || ev.time > ev.def.duration - 3) {
          ev.aliens = [];
          ev.state = "leave";
          audio.play("ufo");
        }
      } else {
        ev.y -= s(260) * dt;
        if (ev.y < -s(80)) ev.time = ev.def.duration;
      }
      for (const b of ev.beams) b.life -= dt;
      ev.beams = ev.beams.filter((b) => b.life > 0);
    },
    draw(game, ev) {
      for (const a of ev.aliens) drawAlien(a.x, game.terrain.yAt(clamp(a.x, 0, W)), a.dir, a.phase);
      ctx.save();
      ctx.strokeStyle = "#5dff6a";
      ctx.lineWidth = 3;
      for (const b of ev.beams) {
        ctx.globalAlpha = b.life * 4;
        line(b.x1, b.y1, b.x2, b.y2, "#5dff6a", 3);
      }
      ctx.restore();
      drawUfo(ev.x, ev.y, ev.time);
    },
  },

  greenArmy: {
    id: "greenArmy",
    name: "MYSTERY GREEN ARMY",
    minStage: 8,
    weight: 1,
    duration: 20,
    warn: "Wait... who ordered THOSE guys?",
    blurb: "A green army nobody ordered! They lob eggs at everyone - any egg splash knocks them out.",
    start(game, ev) {
      ev.hit = new Set();
      ev.shots = [];
      ev.troops = Array.from({ length: 5 }, (_, i) => ({
        x: W * (0.36 + i * 0.07) + rand(-15, 15),
        lift: s(260) + i * s(40),
        dir: Math.random() < 0.5 ? 1 : -1,
        phase: rand(0, 6),
        next: rand(1.5, 3),
        down: 0,
      }));
      audio.play("start_reveille");
    },
    update(game, ev, dt) {
      const leaving = ev.time > ev.def.duration - 4;
      for (const t of ev.troops) {
        if (t.down) {
          t.down += dt;
          continue;
        }
        if (t.lift > 0) {
          t.lift = Math.max(0, t.lift - s(CHICK_FALL_SPEED) * dt);
          continue;
        }
        const ground = game.terrain.yAt(clamp(t.x, 0, W));
        // Any egg flying through a green trooper knocks him out.
        if (game.eggs.some((e) => Math.abs(e.x - t.x) < s(16) && Math.abs(e.y - (ground - s(24))) < s(26))) {
          t.down = 0.01;
          Effects.smoke(t.x, ground - s(20), 4);
          audio.play("pop");
          continue;
        }
        if (leaving) {
          t.dir = t.x < W / 2 ? -1 : 1;
          t.x += t.dir * s(120) * dt;
          t.phase += dt * 12;
          continue;
        }
        t.x += Math.sin(ev.time * 0.8 + t.phase) * s(20) * dt;
        if ((t.next -= dt) > 0) continue;
        t.next = rand(2, 3.2);
        const targets = groundTargets(game).filter((u) => !ev.hit.has(u) && Math.abs(u.x - t.x) < s(520) && Math.abs(u.x - t.x) > s(40));
        if (!targets.length) continue;
        const u = choice(targets);
        t.dir = Math.sign(u.x - t.x) || 1;
        const time = 1.1;
        const sx = t.x;
        const sy = ground - s(30);
        ev.shots.push({ x: sx, y: sy, vx: (u.x - sx) / time, vy: (u.y - sy - 0.5 * GRAVITY * time * time) / time });
        audio.play("fire");
      }
      for (const sh of ev.shots) {
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.vy += GRAVITY * dt;
        const g = game.terrain.yAt(clamp(sh.x, 0, W));
        if (sh.y < g) continue;
        sh.done = true;
        Effects.yolk(sh.x, g, 4, 0.7);
        const victim = groundTargets(game).find((u) => !ev.hit.has(u) && Math.abs(u.x - sh.x) < s(22));
        if (victim && visitorHit(game, ev, victim)) eventRemark(game, ev, victim.x, GREEN_LINES);
      }
      ev.shots = ev.shots.filter((sh) => !sh.done && sh.x > -50 && sh.x < W + 50);
      ev.troops = ev.troops.filter((t) => t.down < 1 && t.x > -s(40) && t.x < W + s(40));
      if (!ev.troops.length && ev.time > 3) ev.time = Math.max(ev.time, ev.def.duration - 0.5);
    },
    draw(game, ev) {
      for (const t of ev.troops) {
        const ground = game.terrain.yAt(clamp(t.x, 0, W));
        ctx.save();
        if (t.down) {
          ctx.globalAlpha = Math.max(0, 1 - t.down);
          ctx.translate(t.x, ground);
          ctx.rotate(Math.PI / 2);
          ctx.translate(-t.x, -ground);
        }
        drawGreenTrooper(t, ground);
        ctx.restore();
      }
      ctx.save();
      ctx.fillStyle = "#9be08f";
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      for (const sh of ev.shots) {
        ctx.beginPath();
        ctx.ellipse(sh.x, sh.y, s(8), s(10), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  eggstorm: {
    id: "eggstorm",
    name: "EGG STORM",
    minStage: 6,
    weight: 1,
    biomes: { meadow: 1.5, kitchen: 1.5 },
    duration: 10,
    warn: "The clouds look... eggy.",
    blurb: "It's raining eggs! Anyone can get bonked - but only once.",
    start(game, ev) {
      ev.hit = new Set();
      ev.drops = [];
      ev.next = 0;
      audio.play("event_warn");
    },
    update(game, ev, dt) {
      if (ev.time < ev.def.duration - 2 && (ev.next -= dt) <= 0) {
        ev.next = 0.12;
        ev.drops.push({ x: rand(s(40), W - s(40)), y: -s(20), vy: rand(260, 360), spin: rand(0, 6) });
      }
      for (const d of ev.drops) {
        d.y += d.vy * dt;
        d.vy += GRAVITY * 0.5 * dt;
        d.spin += dt * 6;
        const g = game.terrain.yAt(d.x);
        if (d.y < g) continue;
        d.done = true;
        Effects.yolk(d.x, g, 4, 0.8);
        if (Math.random() < 0.25) game.addTerrainSplat(d.x);
        const victim = game.living().find((u) => Hazards.isGround(u) && !(u instanceof Castle) && !ev.hit.has(u) && Math.abs(u.x - d.x) < s(16));
        if (victim && visitorHit(game, ev, victim)) eventRemark(game, ev, victim.x, STORM_LINES);
      }
      ev.drops = ev.drops.filter((d) => !d.done);
    },
    draw(game, ev) {
      ctx.save();
      ctx.fillStyle = WHITE;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const d of ev.drops) {
        ctx.moveTo(d.x + s(9), d.y);
        ctx.ellipse(d.x, d.y, s(9), s(12), d.spin * 0.2, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },

  squirrel: {
    id: "squirrel",
    name: "HUNGRY SQUIRREL",
    minStage: 5,
    weight: 1,
    biomes: { meadow: 2, jungle: 1.5 },
    duration: 26,
    warn: "Something fluffy is eyeing your eggs...",
    blurb: "A giant squirrel snatches eggs right out of the air - from both armies!",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.x = ev.dir > 0 ? -s(60) : W + s(60);
      ev.jump = 0;
      ev.jumpV = 0;
      ev.gait = 0;
      ev.eaten = 0;
      ev.turned = false;
      audio.play("squeak");
    },
    update(game, ev, dt) {
      ev.x += ev.dir * s(220) * dt;
      ev.gait += dt * 16;
      if (!ev.turned && (ev.dir > 0 ? ev.x > W + s(40) : ev.x < -s(40)) && ev.time < ev.def.duration - 10) {
        ev.dir = -ev.dir;
        ev.turned = true;
      }
      const ground = game.terrain.yAt(clamp(ev.x, 0, W));
      // Leaps at eggs passing overhead.
      if (ev.jump <= 0) {
        const target = game.eggs.find((e) => Math.abs(e.x - ev.x) < s(70) && e.y > ground - s(240) && e.y < ground - s(30));
        if (target) ev.jumpV = Math.min(s(560), Math.sqrt(2 * GRAVITY * (ground - target.y)) + 30);
      }
      if (ev.jumpV > 0 || ev.jump > 0) {
        ev.jump += ev.jumpV * dt;
        ev.jumpV -= GRAVITY * 1.2 * dt;
        if (ev.jump <= 0) {
          ev.jump = 0;
          ev.jumpV = 0;
        }
      }
      const hx = ev.x + ev.dir * s(28);
      const hy = ground - ev.jump - s(46);
      for (const e of [...game.eggs]) {
        if (dist(e.x, e.y, hx, hy) > s(40)) continue;
        game.removeEgg(e);
        ev.eaten++;
        Effects.spawn("ring", hx, hy, 0, 0, 0.2, 6, YOLK);
        if (Math.random() < 0.4) audio.play("squeak");
        if (ev.eaten % 4 === 1) eventRemark(game, ev, ev.x, SQUIRREL_LINES);
      }
      if (ev.turned && (ev.dir > 0 ? ev.x > W + s(80) : ev.x < -s(80))) ev.time = ev.def.duration;
    },
    draw(game, ev) {
      if (ev.x < -s(80) || ev.x > W + s(80)) return;
      drawSquirrel(ev.x, game.terrain.yAt(clamp(ev.x, 0, W)) - ev.jump, ev.dir, ev.gait, ev.eaten);
    },
  },
});

"use strict";

// Oddity events (ROADMAP section 22): alien jellyfish, a killer robot, a cat stampede and a bacon
// monster. Same rules as every surprise event: at most one per stage, a warning first, both
// armies treated alike, and at most one hit per unit from the event.

const JELLY_LINES = ["Bzzzt!", "It's... pretty?", "My hair!", "Shocking!"];
const ROBOT_LINES = ["EXTERMINATE-ISH!", "Beep boop, duck!", "Is it on our side?", "Unplug it!"];
const CAT_LINES = ["Meow?!", "So many cats!", "Here, kitty!", "Not the laser!"];
const BACON_LINES = ["Mmm... bacon?", "It's greasy!", "Whoa, slippery!", "Breakfast is attacking!"];

function drawJelly(x, y, t, a) {
  const r = s(18);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(200,120,255,0.55)";
  ctx.strokeStyle = "#8a4fd8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.quadraticCurveTo(x, y + r * 0.35, x - r, y);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const tx = x - r * 0.6 + i * r * 0.4;
    ctx.beginPath();
    ctx.moveTo(tx, y + 2);
    ctx.quadraticCurveTo(tx + Math.sin(t * 4 + i) * 6, y + r * 0.9, tx + Math.sin(t * 3 + i) * 4, y + r * 1.6);
    ctx.stroke();
  }
  ctx.fillStyle = "#fff6ff";
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.4, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRobot(rb, t) {
  const x = rb.x;
  const y = rb.y;
  const r = s(36);
  const step = Math.sin(rb.walk) * r * 0.3;
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  line(x - r * 0.3, y - r * 0.8, x - r * 0.3 + step, y, LINE, 4);
  line(x + r * 0.3, y - r * 0.8, x + r * 0.3 - step, y, LINE, 4);
  ctx.fillStyle = rb.flash > 0 ? WHITE : "#a9b4bf";
  ctx.fillRect(x - r * 0.7, y - r * 2.1, r * 1.4, r * 1.3);
  ctx.strokeRect(x - r * 0.7, y - r * 2.1, r * 1.4, r * 1.3);
  ctx.fillRect(x - r * 0.45, y - r * 2.75, r * 0.9, r * 0.6);
  ctx.strokeRect(x - r * 0.45, y - r * 2.75, r * 0.9, r * 0.6);
  // Scanning red eye and antenna.
  ctx.fillStyle = "#ff3030";
  ctx.fillRect(x - r * 0.3 + Math.sin(t * 3) * r * 0.15, y - r * 2.55, r * 0.6 * 0.5, r * 0.18);
  line(x, y - r * 2.75, x, y - r * 3.1, LINE, 2);
  ctx.fillStyle = Math.floor(t * 4) % 2 ? "#ff3030" : YOLK;
  ctx.beginPath();
  ctx.arc(x, y - r * 3.15, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Laser arm and a few rivets.
  line(x + rb.dir * r * 0.7, y - r * 1.6, x + rb.dir * r * 1.3, y - r * 1.7, LINE, 5);
  ctx.fillStyle = LINE;
  for (let i = 0; i < 3; i++) ctx.fillRect(x - r * 0.45 + i * r * 0.4, y - r * 1.2, 2.5, 2.5);
  if (rb.laser) {
    ctx.strokeStyle = "rgba(255,40,40,0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + rb.dir * r * 1.3, y - r * 1.7);
    ctx.lineTo(rb.laser.x, rb.laser.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCat(x, y, dir, phase, k) {
  const r = s(15);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = ["#f0a050", "#555", "#eee", "#c87a3a"][k % 4];
  const leg = Math.sin(phase) * r * 0.5;
  line(-r * 0.6, -r * 0.5, -r * 0.6 + leg, 0, LINE, 1.5);
  line(r * 0.6, -r * 0.5, r * 0.6 - leg, 0, LINE, 1.5);
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.8, r, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 1.05, -r * 1.15, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Ears and a tail held high.
  ctx.beginPath();
  ctx.moveTo(r * 0.75, -r * 1.45);
  ctx.lineTo(r * 0.85, -r * 1.85);
  ctx.lineTo(r * 1.05, -r * 1.55);
  ctx.moveTo(r * 1.15, -r * 1.55);
  ctx.lineTo(r * 1.35, -r * 1.85);
  ctx.lineTo(r * 1.4, -r * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.9);
  ctx.quadraticCurveTo(-r * 1.6, -r * 1.6, -r * 1.3, -r * 2.1);
  ctx.stroke();
  ctx.restore();
}

function drawBacon(m, t) {
  const r = s(44) * m.rise;
  if (r < 1) return;
  ctx.save();
  // Giant frying pan.
  ctx.fillStyle = "#3a3a3a";
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(m.panX, m.panY, s(60), s(12), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  line(m.panX + s(58), m.panY, m.panX + s(110), m.panY - s(10), "#3a3a3a", 6);
  // The bacon creature: a wavy strip standing up.
  const x = m.x;
  const y = m.y;
  ctx.lineCap = "round";
  for (const [w, c] of [[r * 0.75, LINE], [r * 0.62, "#c0392b"], [r * 0.22, "#f6d3b0"]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      const px = x + Math.sin(t * 6 + k * 7) * r * 0.25 + (m.flop > 0 ? m.dir * k * r * 1.6 * m.flop : 0);
      const py = y - k * r * 2.6 * (m.flop > 0 ? 1 - m.flop * 0.8 : 1);
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.lineCap = "butt";
  // Googly eyes near the top.
  const ex = x + Math.sin(t * 6 + 7) * r * 0.25;
  const ey = y - r * 2.4 * (m.flop > 0 ? 1 - m.flop * 0.8 : 1);
  for (const dx of [-0.18, 0.18]) {
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(ex + dx * r, ey, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(ex + dx * r + m.dir * 1.5, ey, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

Object.assign(EVENT_TYPES, {
  jellyfish: {
    id: "jellyfish",
    name: "ALIEN JELLYFISH",
    minStage: 9,
    weight: 0.9,
    nightWeight: 2.5,
    biomes: { beach: 2, moon: 3 },
    duration: 12,
    warn: "A strange portal is opening...",
    blurb: "Glowing jellyfish drift down from space - one touch and you're buzzing!",
    start(game, ev) {
      ev.portalX = W * rand(0.35, 0.65);
      ev.jellies = Array.from({ length: 6 }, (_, i) => ({ x: ev.portalX + rand(-40, 40), y: H * 0.1, vx: (i - 2.5) * rand(14, 26), vy: rand(30, 50), p: rand(0, 6) }));
      audio.play("ufo");
    },
    update(game, ev, dt) {
      const leaving = ev.time > ev.def.duration - 2.5;
      for (const j of ev.jellies) {
        j.p += dt;
        j.x = clamp(j.x + (j.vx + Math.sin(j.p * 1.5) * 25) * dt, s(40), W - s(40));
        const floor = game.terrain.yAt(clamp(j.x, 0, W)) - s(36);
        if (leaving) j.y -= s(160) * dt;
        else j.y = Math.min(floor, j.y + j.vy * dt + Math.sin(j.p * 2) * 12 * dt);
        if (j.y >= floor - 1 && !leaving) j.vy = -Math.abs(j.vy) * 0.5;
        if (j.y < H * 0.25 && j.vy < 0) j.vy = rand(30, 50);
        for (const u of game.living()) {
          if (u.isBoss || u.jellied || dist(u.x, u.y, j.x, j.y + s(14)) > u.radius() + s(18)) continue;
          u.jellied = true;
          u.stagger = Math.max(u.stagger || 0, 1);
          Effects.sparks(u.x, u.y - u.size * 0.3, 6, "#c78cff");
          game.damageUnit(u, 1);
          audio.play("zap");
          eventRemark(game, ev, u.x, JELLY_LINES);
        }
      }
    },
    end(game) {
      for (const u of game.units) delete u.jellied;
    },
    draw(game, ev) {
      const open = Math.min(1, ev.time * 2, (ev.def.duration - ev.time) * 2);
      ctx.save();
      ctx.globalAlpha = open * 0.8;
      ctx.strokeStyle = "#8a4fd8";
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(ev.portalX, H * 0.1, s(60 - i * 15) * open, s(16 - i * 4) * open, Math.sin(ev.time + i) * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      const a = Math.min(0.9, ev.time * 2, (ev.def.duration - ev.time) * 2);
      for (const j of ev.jellies) drawJelly(j.x, j.y, ev.time + j.p, a);
    },
  },

  robot: {
    id: "robot",
    name: "KILLER ROBOT",
    minStage: 11,
    weight: 0.9,
    biomes: { kitchen: 2, moon: 2 },
    duration: 16,
    warn: "Clank... clank... clank...",
    blurb: "A killer robot zaps the nearest troops on both sides - short it out with eggs!",
    start(game, ev) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      ev.robot = { x: dir > 0 ? -s(40) : W + s(40), y: 0, dir, walk: 0, hp: 7 + Math.floor(game.stage / 8), cool: 2, flash: 0, laser: null, laserT: 0 };
      audio.play("horn");
    },
    update(game, ev, dt) {
      const rb = ev.robot;
      if (!rb) return;
      const leaving = ev.time > ev.def.duration - 2.5;
      rb.flash = Math.max(0, rb.flash - dt);
      rb.laserT = Math.max(0, rb.laserT - dt);
      if (rb.laserT <= 0) rb.laser = null;
      rb.y = game.terrain.yAt(clamp(rb.x, 0, W));
      const centreGoal = leaving ? (rb.dir > 0 ? W + s(80) : -s(80)) : W * 0.5 + Math.sin(ev.time * 0.4) * W * 0.18;
      if (Math.abs(centreGoal - rb.x) > s(4)) {
        rb.x += Math.sign(centreGoal - rb.x) * s(55) * dt;
        rb.walk += dt * 7;
      }
      if (!leaving && (rb.cool -= dt) <= 0) {
        const pool = game.living().filter((u) => !u.isBoss && !u.lasered && Math.abs(u.x - rb.x) < s(380));
        const t = pool.reduce((best, u) => (!best || Math.abs(u.x - rb.x) < Math.abs(best.x - rb.x) ? u : best), null);
        rb.cool = 1.6;
        if (t) {
          t.lasered = true;
          rb.dir = Math.sign(t.x - rb.x) || rb.dir;
          rb.laser = { x: t.x, y: t.y - t.size * 0.3 };
          rb.laserT = 0.25;
          Effects.sparks(t.x, t.y - t.size * 0.3, 6, "#ff4040");
          game.damageUnit(t, 1);
          audio.play("zap");
          eventRemark(game, ev, t.x, ROBOT_LINES);
        }
      }
      const r = s(36);
      for (const e of [...game.eggs]) {
        if (Math.abs(e.x - rb.x) < r * 0.8 && e.y > rb.y - r * 2.8 && e.y < rb.y + 4) {
          game.removeEgg(e);
          rb.hp -= 1;
          rb.flash = 0.12;
          Effects.sparks(e.x, e.y, 3, YOLK);
          if (rb.hp <= 0) {
            Effects.explosion(rb.x, rb.y - r, 1.6, LINE);
            audio.play("tank_destroyed");
            ev.robot = null;
            break;
          }
        }
      }
    },
    end(game) {
      for (const u of game.units) delete u.lasered;
    },
    draw(game, ev) {
      if (ev.robot) drawRobot(ev.robot, ev.time);
    },
  },

  cats: {
    id: "cats",
    name: "CAT STAMPEDE",
    minStage: 5,
    weight: 1,
    biomes: { kitchen: 2.5, meadow: 1.5 },
    duration: 9,
    warn: "A tiny red dot appears...",
    blurb: "Dozens of cats chase a laser dot - troops get bowled over and eggs swatted!",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.dot = ev.dir > 0 ? -s(20) : W + s(20);
      ev.cats = Array.from({ length: 14 }, (_, i) => ({ off: i * s(26) + rand(0, s(20)), phase: rand(0, 6), k: i, hop: 0 }));
      ev.nextMeow = 0;
    },
    update(game, ev, dt) {
      ev.dot += ev.dir * s(260) * dt;
      if (ev.time >= ev.nextMeow) {
        audio.play("meow");
        ev.nextMeow = ev.time + rand(0.4, 0.9);
      }
      for (const c of ev.cats) {
        c.x = ev.dot - ev.dir * (s(40) + c.off);
        c.phase += dt * 20;
        c.hop = Math.abs(Math.sin(c.phase * 0.5)) * s(5);
      }
      for (const u of groundTargets(game)) {
        if (u.catted || !(u instanceof Soldier || u instanceof Motorcycle)) continue;
        if (ev.cats.some((c) => Math.abs(c.x - u.x) < s(14))) {
          u.catted = true;
          u.knock = rand(0.6, 1);
          u.knockDir = ev.dir;
          eventRemark(game, ev, u.x, CAT_LINES);
        }
      }
      // Cats swat low-flying eggs out of the air.
      for (const e of game.eggs) {
        if (e.swatted) continue;
        const c = ev.cats.find((cat) => Math.abs(cat.x - e.x) < s(14) && Math.abs(game.terrain.yAt(clamp(cat.x, 0, W)) - s(30) - e.y) < s(24));
        if (c) {
          e.swatted = true;
          e.vx = -e.vx * 0.6 + rand(-60, 60);
          e.vy = -Math.abs(e.vy) * 0.7 - 80;
        }
      }
    },
    end(game) {
      for (const u of game.units) delete u.catted;
    },
    draw(game, ev) {
      if (ev.dot > -s(30) && ev.dot < W + s(30)) {
        const gy = game.terrain.yAt(clamp(ev.dot, 0, W)) - 2;
        ctx.save();
        ctx.fillStyle = "rgba(255,30,30,0.9)";
        ctx.beginPath();
        ctx.arc(ev.dot, gy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,30,30,0.25)";
        ctx.beginPath();
        ctx.arc(ev.dot, gy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const c of ev.cats) {
        if (c.x < -s(40) || c.x > W + s(40)) continue;
        drawCat(c.x, game.terrain.yAt(clamp(c.x, 0, W)) - c.hop, ev.dir, c.phase, c.k);
      }
    },
  },

  bacon: {
    id: "bacon",
    name: "BACON MONSTER",
    minStage: 8,
    weight: 0.9,
    biomes: { kitchen: 3, volcano: 1.5 },
    duration: 15,
    warn: "Something is sizzling...",
    blurb: "A bacon monster flops onto troops and leaves slippery grease everywhere!",
    start(game, ev) {
      const x = W * rand(0.38, 0.62);
      ev.monster = { x, y: game.terrain.yAt(x), panX: x, panY: game.terrain.yAt(x), rise: 0, dir: 1, cool: 2.2, flop: 0 };
      ev.puddles = [];
      audio.play("slime");
    },
    update(game, ev, dt) {
      const m = ev.monster;
      const leaving = ev.time > ev.def.duration - 1.5;
      m.rise = leaving ? Math.max(0, m.rise - dt) : Math.min(1, m.rise + dt);
      m.flop = Math.max(0, m.flop - dt * 1.6);
      for (const pd of ev.puddles) pd.life -= dt;
      ev.puddles = ev.puddles.filter((pd) => pd.life > 0);
      for (const u of groundTargets(game)) {
        if (ev.puddles.some((pd) => Math.abs(pd.x - u.x) < pd.r)) u.greasy = 0.3;
      }
      if (leaving || m.rise < 1) return;
      if (Math.random() < dt * 3) Effects.spawn("smoke", m.x + rand(-20, 20), m.y - s(40), rand(-10, 10), -40, 0.6, 4, LINE);
      if ((m.cool -= dt) <= 0) {
        m.cool = 2.4;
        const targets = groundTargets(game).filter((u) => Math.abs(u.x - m.panX) < s(220));
        const t = targets.length ? choice(targets) : null;
        m.dir = t ? Math.sign(t.x - m.x) || 1 : choice([-1, 1]);
        m.flop = 1;
        const landX = clamp(m.x + m.dir * s(90), s(50), W - s(50));
        ev.puddles.push({ x: landX, r: s(50), life: 6 });
        audio.play("slime");
        for (const u of groundTargets(game)) {
          if (Math.abs(u.x - landX) > s(50)) continue;
          if (!u.baconed) {
            u.baconed = true;
            game.damageUnit(u, 1);
          }
          u.stagger = Math.max(u.stagger || 0, 0.8);
          eventRemark(game, ev, u.x, BACON_LINES);
        }
      }
    },
    end(game) {
      for (const u of game.units) delete u.baconed;
    },
    draw(game, ev) {
      ctx.save();
      for (const pd of ev.puddles) {
        ctx.globalAlpha = Math.min(1, pd.life) * 0.6;
        ctx.fillStyle = "#e8c070";
        ctx.beginPath();
        ctx.ellipse(pd.x, game.terrain.yAt(clamp(pd.x, 0, W)), pd.r, s(6), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      drawBacon(ev.monster, ev.time);
    },
  },
});

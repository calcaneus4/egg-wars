"use strict";

// Detour events (ROADMAP section 28): a dinosaur stampede, a lost rideshare driver, a pizza
// delivery and a case of the giggles. Same rules as every surprise event: at most one per stage,
// a warning first, both armies treated alike, and at most one hit per unit.

const DINO_LINES = ["DINOSAURS?!", "Run!", "Is that a triceratops?", "Not the horns!"];
const UBER_LINES = ["Are you... Kevin?", "This isn't my stop!", "Wrong way!", "Five stars!"];
const PIZZA_LINES = ["PIZZA!", "Extra cheese!", "Lunch break!", "Mmm, pepperoni!"];
const GIGGLE_LINES = ["HA HA HA!", "Hee hee hee!", "I can't stop!", "Snrk... HAHA!"];
const DINO_COLORS = ["#7fae5a", "#c9a24a", "#8f7fbf", "#d97a4a"];
const GIGGLE_SECONDS = 7;
const GIGGLE_MAX = 14;

function drawDino(x, y, dir, phase, size, color) {
  const r = s(50) * size;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.8;
  // Legs.
  const step = Math.sin(phase) * r * 0.25;
  for (const [lx, k] of [[-r * 0.55, 1], [-r * 0.25, -1], [r * 0.25, 1], [r * 0.5, -1]]) line(lx, -r * 0.4, lx + step * k, 0, LINE, sw(5));
  ctx.fillStyle = color;
  // Tail and body.
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -r * 0.65);
  ctx.quadraticCurveTo(-r * 1.3, -r * 0.6, -r * 1.45, -r * 0.35);
  ctx.quadraticCurveTo(-r * 1.1, -r * 0.42, -r * 0.7, -r * 0.35);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.62, r * 0.85, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Frill, head and three horns.
  ctx.beginPath();
  ctx.ellipse(r * 0.85, -r * 0.82, r * 0.32, r * 0.42, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(r * 1.1, -r * 0.55, r * 0.34, r * 0.22, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = WHITE;
  for (const [hx, hy, len] of [[r * 1.05, -r * 0.72, 0.4], [r * 1.25, -r * 0.7, 0.35], [r * 1.38, -r * 0.55, 0.2]]) {
    ctx.beginPath();
    ctx.moveTo(hx - r * 0.05, hy);
    ctx.lineTo(hx + r * len * 0.6, hy - r * len);
    ctx.lineTo(hx + r * 0.08, hy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(r * 1.12, -r * 0.62, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRideCar(x, y, dir, honk) {
  const r = s(46);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.8;
  // Body, cabin and windows.
  ctx.fillStyle = "#3a3f47";
  ctx.beginPath();
  ctx.moveTo(-r * 1.2, -r * 0.25);
  ctx.lineTo(-r * 1.2, -r * 0.6);
  ctx.lineTo(-r * 0.6, -r * 0.62);
  ctx.lineTo(-r * 0.35, -r * 1.0);
  ctx.lineTo(r * 0.45, -r * 1.0);
  ctx.lineTo(r * 0.75, -r * 0.62);
  ctx.lineTo(r * 1.2, -r * 0.55);
  ctx.lineTo(r * 1.2, -r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#bfe3f2";
  ctx.fillRect(-r * 0.3, -r * 0.92, r * 0.32, r * 0.26);
  ctx.fillRect(r * 0.1, -r * 0.92, r * 0.36, r * 0.26);
  // Glowing sign on the windscreen and a headlight.
  ctx.fillStyle = WHITE;
  ctx.fillRect(r * 0.15, -r * 0.88, r * 0.22, r * 0.1);
  ctx.fillStyle = YOLK;
  ctx.beginPath();
  ctx.arc(r * 1.12, -r * 0.45, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // Wheels.
  ctx.fillStyle = LINE;
  for (const wx of [-r * 0.7, r * 0.7]) {
    ctx.beginPath();
    ctx.arc(wx, -r * 0.22, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  if (honk > 0) {
    ctx.font = "bold 14px Courier New";
    ctx.fillText("HONK!", r * 0.9, -r * 1.2);
  }
  ctx.restore();
}

function drawScooter(x, y, dir) {
  const r = s(38);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.8;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, -r * 0.45, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  line(r * 0.5, -r * 0.45, r * 0.7, -r * 1.2, LINE, 2);
  line(r * 0.6, -r * 1.2, r * 0.85, -r * 1.2, LINE, 2);
  // Pizza box on the back and the rider.
  ctx.fillStyle = "#e8c690";
  ctx.fillRect(-r * 1.05, -r * 1.15, r * 0.6, r * 0.5);
  ctx.strokeRect(-r * 1.05, -r * 1.15, r * 0.6, r * 0.5);
  line(-r * 0.1, -r * 0.7, r * 0.2, -r * 1.5, LINE, 2);
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(r * 0.25, -r * 1.7, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.fillRect(r * 0.05, -r * 1.95, r * 0.42, r * 0.12);
  ctx.fillStyle = LINE;
  for (const wx of [-r * 0.75, r * 0.6]) {
    ctx.beginPath();
    ctx.arc(wx, -r * 0.18, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPizzaBox(x, y, slices) {
  const r = s(24);
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = "#e8c690";
  ctx.fillRect(x - r, y - r * 0.35, r * 2, r * 0.35);
  ctx.strokeRect(x - r, y - r * 0.35, r * 2, r * 0.35);
  // Open lid with the pizza showing.
  ctx.fillStyle = "#f2b84b";
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.4, r * 0.85, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#c0392b";
  for (let i = 0; i < slices * 2; i++) {
    ctx.beginPath();
    ctx.arc(x - r * 0.5 + i * r * 0.33, y - r * 0.42 + (i % 2 ? r * 0.08 : -r * 0.06), r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

Object.assign(EVENT_TYPES, {
  dinos: {
    id: "dinos",
    name: "DINOSAUR STAMPEDE",
    minStage: 9,
    weight: 1,
    biomes: { prehistoric: 3, jungle: 1.5, desert: 1.3 },
    duration: 9,
    warn: "The ground is shaking... THUD... THUD...",
    blurb: "Dinosaur stampede! Light troops get tossed, tanks get shoved.",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.dinos = [];
      const count = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        ev.dinos.push({
          x: (ev.dir > 0 ? -s(80) : W + s(80)) - ev.dir * (i * rand(s(110), s(190))),
          speed: rand(s(380), s(480)),
          phase: rand(0, Math.PI * 2),
          size: rand(0.85, 1.2),
          color: choice(DINO_COLORS),
        });
      }
      ev.nextThud = 0;
      audio.play("roar");
    },
    update(game, ev, dt) {
      if (ev.time >= ev.nextThud) {
        Effects.shake(1.5);
        ev.nextThud = ev.time + 0.45;
      }
      for (const d of ev.dinos) {
        d.x += ev.dir * d.speed * dt;
        d.phase += dt * 14;
        if (Math.random() < dt * 3) Effects.smoke(d.x - ev.dir * s(30), game.terrain.yAt(clamp(d.x, 0, W)) - 4, 1);
      }
      for (const u of groundTargets(game)) {
        if (u.bowled || u instanceof Castle) continue;
        const hit = ev.dinos.find((d) => Math.abs(d.x - u.x) < s(40) * d.size);
        if (!hit) continue;
        u.bowled = true;
        if (u instanceof Tank || u.heavy) {
          // Heavy units are shoved along and rattled, not thrown.
          u.x = clamp(u.x + ev.dir * s(40), s(45), W - s(45));
          u.stagger = Math.max(u.stagger || 0, 1);
        } else {
          u.airborne = true;
          u.lift = s(10);
          u.spin = 0;
          Events.release(u, ev.dir * rand(80, 160));
          u.liftV = rand(160, 230);
        }
        eventRemark(game, ev, u.x, DINO_LINES);
      }
    },
    end(game) {
      for (const u of game.units) delete u.bowled;
    },
    draw(game, ev) {
      for (const d of ev.dinos) {
        if (d.x < -s(120) || d.x > W + s(120)) continue;
        drawDino(d.x, game.terrain.yAt(clamp(d.x, 0, W)), ev.dir, d.phase, d.size, d.color);
      }
    },
  },

  uber: {
    id: "uber",
    name: "LOST RIDESHARE DRIVER",
    minStage: 6,
    weight: 1,
    biomes: { kitchen: 1.5, beach: 1.5 },
    duration: 30,
    warn: "*HONK HONK* Is this the pickup spot?",
    blurb: "A lost driver picks up one trooper from each army... and drops them off at the wrong end.",
    allowed(game) {
      return game.living(RIGHT).length >= 3 && game.living(LEFT).length >= 3;
    },
    start(game, ev) {
      const first = Math.random() < 0.5 ? RIGHT : LEFT;
      ev.order = [first, -first];
      ev.step = 0;
      ev.x = first === RIGHT ? -s(80) : W + s(80);
      ev.dir = first === RIGHT ? 1 : -1;
      ev.state = "seek";
      ev.honk = 0;
      ev.wait = 0;
      audio.play("honk");
    },
    pickRider(game, side) {
      const pool = game.living(side).filter((u) => Hazards.isGround(u) && !u.isBoss && !u.heavy && !(u instanceof Tank) && !(u instanceof Castle) && !u.airborne);
      if (game.living(side).length < 3 || !pool.length) return null;
      return choice(pool);
    },
    update(game, ev, dt) {
      ev.honk = Math.max(0, ev.honk - dt);
      const speed = s(340) * dt;
      if (ev.state === "seek") {
        if (!ev.rider || ev.rider.dead || ev.rider.airborne) ev.rider = ev.step < 2 ? ev.def.pickRider(game, ev.order[ev.step]) : null;
        if (!ev.rider) {
          ev.state = "leave";
          return;
        }
        const dx = ev.rider.x - ev.x;
        ev.dir = Math.sign(dx) || ev.dir;
        ev.x += clamp(dx, -speed, speed);
        if (Math.abs(dx) < s(6)) {
          ev.state = "pickup";
          ev.wait = 0.8;
          ev.honk = 0.5;
          audio.play("honk");
          const r = ev.rider;
          r.caughtBy = ev;
          r.airborne = true;
          if (game.canSpeak(r)) r.say(UBER_LINES[0], 1.2);
        }
      } else if (ev.state === "pickup") {
        ev.wait -= dt;
        if (ev.wait <= 0) {
          // The "wrong end": right back to the rider's own castle.
          ev.dropX = ev.rider.side === RIGHT ? s(130) : W - s(130);
          ev.state = "ride";
        }
      } else if (ev.state === "ride") {
        const dx = ev.dropX - ev.x;
        ev.dir = Math.sign(dx) || ev.dir;
        ev.x += clamp(dx, -speed, speed);
        if (Math.abs(dx) < s(6) || ev.rider.dead) {
          const r = ev.rider;
          if (!r.dead) {
            r.caughtBy = null;
            r.airborne = false;
            r.lift = 0;
            if (game.canSpeak(r)) r.say(choice(UBER_LINES.slice(1)), 1.3);
          }
          ev.rider = null;
          ev.step++;
          ev.state = "seek";
          ev.honk = 0.5;
          audio.play("honk");
        }
      } else {
        ev.x += ev.dir * speed;
        if (ev.x < -s(120) || ev.x > W + s(120)) ev.time = ev.def.duration;
      }
      // The passenger rides on the roof.
      if (ev.rider && ev.rider.caughtBy === ev) {
        ev.rider.x = clamp(ev.x, s(30), W - s(30));
        ev.rider.lift = s(44);
      }
    },
    end(game, ev) {
      const r = ev.rider;
      if (r && !r.dead && r.caughtBy === ev) {
        r.caughtBy = null;
        r.airborne = false;
        r.lift = 0;
      }
    },
    draw(game, ev) {
      drawRideCar(ev.x, game.terrain.yAt(clamp(ev.x, 0, W)) + s(6), ev.dir, ev.honk);
    },
  },

  pizza: {
    id: "pizza",
    name: "PIZZA DELIVERY",
    minStage: 5,
    weight: 1,
    biomes: { kitchen: 2.5 },
    duration: 16,
    warn: "Did somebody order a pizza?",
    blurb: "Pizza! Troops stop for a slice and heal 1 hit.",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.x = ev.dir > 0 ? -s(60) : W + s(60);
      ev.boxes = [];
      ev.drops = [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => (ev.dir > 0 ? W * f : W * (1 - f)));
      audio.play("honk");
    },
    update(game, ev, dt) {
      ev.x += ev.dir * s(300) * dt;
      while (ev.drops.length && (ev.x - ev.drops[0]) * ev.dir >= 0) {
        ev.boxes.push({ x: ev.drops.shift(), slices: 2, fall: s(50) });
        audio.play("pop");
      }
      for (const b of ev.boxes) b.fall = Math.max(0, b.fall - s(200) * dt);
      if (ev.time > ev.def.duration - 1) return;
      for (const u of groundTargets(game)) {
        if (u.posing > 0 || u.ate) continue;
        const b = ev.boxes.find((box) => box.slices > 0 && !box.fall && Math.abs(box.x - u.x) < s(26));
        if (!b) continue;
        b.slices--;
        u.ate = true;
        u.posing = 1.2;
        if (u.maxHp) u.hp = Math.min(u.maxHp, u.hp + 1);
        Effects.spawn("ring", u.x, u.y, 0, 0, 0.3, 6, YOLK);
        eventRemark(game, ev, u.x, PIZZA_LINES);
        audio.play("coin");
      }
      ev.boxes = ev.boxes.filter((box) => box.slices > 0);
    },
    end(game) {
      for (const u of game.units) delete u.ate;
    },
    draw(game, ev) {
      for (const b of ev.boxes) drawPizzaBox(b.x, game.terrain.yAt(clamp(b.x, 0, W)) - b.fall, b.slices);
      if (ev.x > -s(60) && ev.x < W + s(60)) drawScooter(ev.x, game.terrain.yAt(clamp(ev.x, 0, W)), ev.dir);
    },
  },

  giggles: {
    id: "giggles",
    name: "GIGGLE FITS",
    minStage: 7,
    weight: 1,
    biomes: { candy: 2 },
    duration: 14,
    warn: "Somebody told a really good joke...",
    blurb: "The giggles are catching! Laughing troops stop to hold their sides.",
    start(game, ev) {
      for (const side of [RIGHT, LEFT]) {
        const pool = groundTargets(game).filter((u) => u.side === side);
        if (pool.length) choice(pool).giggly = GIGGLE_SECONDS;
      }
      ev.check = 0;
      ev.pops = [];
      audio.play("laugh");
    },
    update(game, ev, dt) {
      const units = groundTargets(game);
      for (const u of units) {
        if (!(u.giggly > 0)) continue;
        u.giggly = Math.max(0, u.giggly - dt);
        u.giggleNext = (u.giggleNext ?? rand(0.2, 1)) - dt;
        if (u.giggleNext <= 0 && u.giggly > 0) {
          u.giggleNext = rand(1.6, 2.6);
          u.laughing = 0.9;
          ev.pops.push({ x: u.x, y: u.y - u.size, life: 0.8 });
          if (Math.random() < 0.3) audio.play("laugh");
          if (Math.random() < 0.2) eventRemark(game, ev, u.x, GIGGLE_LINES);
        }
      }
      for (const p of ev.pops) {
        p.life -= dt;
        p.y -= s(30) * dt;
      }
      ev.pops = ev.pops.filter((p) => p.life > 0);
      if ((ev.check -= dt) > 0 || ev.time > ev.def.duration - 4) return;
      ev.check = 0.5;
      let infected = units.filter((u) => u.giggly > 0).length;
      for (const u of units) {
        if (!(u.giggly > 0) || infected >= GIGGLE_MAX) continue;
        for (const o of units) {
          if (o.giggly > 0 || o.giggled || Math.abs(o.x - u.x) > s(40) || Math.random() > 0.5) continue;
          o.giggly = GIGGLE_SECONDS;
          o.giggled = true;
          infected++;
        }
      }
    },
    end(game) {
      for (const u of game.units) {
        delete u.giggled;
        u.giggly = 0;
        u.laughing = 0;
      }
    },
    draw(game, ev) {
      ctx.save();
      ctx.font = "bold 13px Courier New";
      ctx.fillStyle = LINE;
      for (const p of ev.pops) {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillText("HA HA!", p.x - 20, p.y);
      }
      ctx.restore();
    },
  },
});

"use strict";

// Surprise events: rare, funny, neutral happenings that shake up a battle (DESIGN.md section 12).
// The Variety Director picks at most one per stage and when it happens. Each event gets a
// warning banner first, then runs for `duration` seconds. Events treat both armies the same and
// never deal more than one hit to a unit.
//
// An event type is data plus hooks:
//   minStage, weight      when it can appear and how likely it is against the others
//   warn, title, blurb    banner text (warning, then the name with a one-line explanation)
//   start/update/draw/end optional hooks, called with (game, ev[, dt])

const EVENT_WARN_SECONDS = 2.5;
const QUAKE_JOLTS = 4;
const QUAKE_LINES = ["Whoa!", "The ground!", "Hold on!", "Not my eggs!", "Earth-QUAKE!", "Who ordered this?"];

const TORNADO_LINES = ["Wheee!", "Put me down!", "I can fly!", "Not again!", "Bawk?!", "Mommy!"];
const TORNADO_MAX_CAUGHT = 6;

const WAVE_LINES = ["Glub!", "Surf's up!", "I can't swim!", "Cowabunga!", "My boots!", "Who left the tap on?"];
const WAVE_LENGTH = 380;
const WAVE_HEIGHT = 150;
const WAVE_PUSH = 130;

const STAMPEDE_LINES = ["BAWK!", "Bawk bawk!", "Run for it!", "Not the coop!", "Buk-AWK!"];
const KNOCKED_LINES = ["Oof!", "Hey!", "Feathers!", "Watch it!"];
const UFO_LINES = ["Beam me up?", "Hello?!", "I'm too young!", "Take him instead!"];
const UFO_HOVER_Y = 0.2;

const EVENT_TYPES = {
  stampede: {
    id: "stampede",
    name: "CHICKEN STAMPEDE",
    minStage: 4,
    weight: 1,
    duration: 7,
    warn: "Something is clucking loudly...",
    blurb: "The farm hens broke loose! Little troops get bowled over.",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.hens = [];
      const count = 14 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        ev.hens.push({
          x: (ev.dir > 0 ? -30 : W + 30) - ev.dir * (i * rand(28, 60) + rand(0, 40)),
          speed: rand(300, 420),
          phase: rand(0, Math.PI * 2),
          size: rand(0.85, 1.15),
          hop: 0,
        });
      }
      ev.nextBawk = 0;
    },
    update(game, ev, dt) {
      if (ev.time >= ev.nextBawk) {
        audio.play("bawk");
        ev.nextBawk = ev.time + rand(0.35, 0.8);
      }
      for (const hen of ev.hens) {
        hen.x += ev.dir * hen.speed * dt;
        hen.phase += dt * 22;
        hen.hop = Math.abs(Math.sin(hen.phase * 0.5)) * s(6);
        if (Math.random() < dt * 1.5) Effects.spawn("debris", hen.x, game.terrain.yAt(clamp(hen.x, 0, W)) - s(14), rand(-60, 60), rand(-90, -30), 0.8, 4, WHITE);
        // Hens gobble up egg splats as they go.
        for (const splat of game.splats) if (Math.abs(splat.x - hen.x) < s(10)) splat.age = Math.max(splat.age, 13);
      }
      for (const u of game.living()) {
        if (!(u instanceof Soldier || u instanceof Motorcycle) || u.airborne || u.knock > 0 || u.bowled) continue;
        if (ev.hens.some((hen) => Math.abs(hen.x - u.x) < s(18))) {
          u.bowled = true;
          u.knock = rand(1, 1.6);
          u.knockDir = ev.dir;
          if (game.canSpeak(u) && ev.time >= (ev.nextLine || 0)) {
            u.say(choice(Math.random() < 0.5 ? KNOCKED_LINES : STAMPEDE_LINES), 1.1);
            ev.nextLine = ev.time + rand(0.7, 1.2);
          }
        }
      }
    },
    end(game) {
      for (const u of game.units) delete u.bowled;
    },
    draw(game, ev) {
      for (const hen of ev.hens) {
        if (hen.x < -40 || hen.x > W + 40) continue;
        drawHen(hen.x, game.terrain.yAt(clamp(hen.x, 0, W)) - hen.hop, ev.dir, hen.phase, hen.size * 1.35);
      }
    },
  },
  ufo: {
    id: "ufo",
    name: "UFO ABDUCTION",
    minStage: 8,
    weight: 0.8,
    // Upper limit only: the saucer ends the event itself once it has flown away.
    duration: 25,
    warn: "Strange lights in the sky...",
    blurb: "Aliens beam up one trooper from each army... and leave a cow.",
    allowed(game) {
      return game.living(RIGHT).length >= 3 && game.living(LEFT).length >= 3;
    },
    start(game, ev) {
      const first = Math.random() < 0.5 ? RIGHT : LEFT;
      ev.order = [first, -first];
      ev.step = 0;
      ev.x = first === RIGHT ? -80 : W + 80;
      ev.y = H * 0.08;
      ev.state = "fly";
      ev.beam = 0;
      audio.play("ufo");
    },
    // Picks a matching victim from an army: a soldier if possible, else the cheapest ground unit.
    pickVictim(game, side) {
      const pool = game.living(side).filter((u) => !u.isBoss && !(u instanceof Castle) && !(u instanceof Airplane) && !u.airborne);
      if (game.living(side).length < 3 || !pool.length) return null;
      const soldiers = pool.filter((u) => u.constructor === Soldier);
      return choice(soldiers.length ? soldiers : pool);
    },
    update(game, ev, dt) {
      const hoverY = H * UFO_HOVER_Y;
      if (ev.state === "fly") {
        if (!ev.victim || ev.victim.dead) ev.victim = ev.step < 2 ? ev.def.pickVictim(game, ev.order[ev.step]) : null;
        const tx = ev.step < 2 ? (ev.victim ? ev.victim.x : W / 2) : W / 2;
        const dx = tx - ev.x;
        ev.x += clamp(dx, -s(800) * dt, s(800) * dt);
        ev.y += (hoverY - ev.y) * Math.min(1, dt * 3);
        if (Math.abs(dx) < s(4)) {
          if (ev.step < 2 && ev.victim) {
            ev.state = "beam";
            ev.victim.caughtBy = ev;
            ev.victim.airborne = true;
            ev.victim.spinT = 0;
            if (game.canSpeak(ev.victim)) ev.victim.say(choice(UFO_LINES), 1.6);
            audio.play("beam");
          } else if (ev.step < 2) {
            ev.step++;
          } else {
            ev.state = "cow";
            Events.leftovers.push({ kind: "cow", x: ev.x, y: ev.y + s(20), vy: 0, landed: false, bob: rand(0, 6) });
            audio.play("moo");
          }
        }
      } else if (ev.state === "beam") {
        ev.beam = Math.min(1, ev.beam + dt * 3);
        const v = ev.victim;
        if (v.dead) {
          ev.state = "fly";
          ev.step++;
          return;
        }
        v.lift = (v.lift || 0) + s(320) * dt;
        v.x += (ev.x - v.x) * Math.min(1, dt * 2);
        v.spin = Math.sin(ev.time * 5) * 0.4;
        v.visualScale = Math.max(0.3, 1 - v.lift / s(500));
        if (v.y <= ev.y + s(16)) {
          // Gone without a trace: no kill credit, no wreckage.
          v.dead = true;
          ev.beam = 0;
          ev.victim = null;
          ev.step++;
          ev.state = "fly";
          Effects.sparks(ev.x, ev.y + s(10), 6, YOLK);
          audio.play("unlock");
        }
      } else if (ev.state === "cow") {
        ev.cowTimer = (ev.cowTimer || 0) + dt;
        if (ev.cowTimer > 1) ev.state = "leave";
      } else {
        ev.y -= s(260) * dt;
        ev.x += s(120) * dt;
        if (ev.y < -s(80)) ev.time = ev.def.duration;
      }
    },
    end(game, ev) {
      if (ev.victim && !ev.victim.dead) {
        ev.victim.visualScale = 1;
        Events.release(ev.victim, 0);
      }
    },
    draw(game, ev) {
      if (ev.state === "beam") {
        const ground = game.terrain.yAt(clamp(ev.x, 0, W));
        ctx.save();
        ctx.globalAlpha = 0.35 * ev.beam * (0.8 + 0.2 * Math.sin(ev.time * 20));
        ctx.fillStyle = YOLK;
        ctx.beginPath();
        ctx.moveTo(ev.x - s(18), ev.y + s(8));
        ctx.lineTo(ev.x + s(18), ev.y + s(8));
        ctx.lineTo(ev.x + s(55), ground);
        ctx.lineTo(ev.x - s(55), ground);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      drawUfo(ev.x, ev.y + Math.sin(ev.time * 3) * 3, ev.time);
    },
  },

  tsunami: {
    id: "tsunami",
    name: "TSUNAMI",
    minStage: 6,
    weight: 1,
    duration: 9,
    warn: "Is that... the sea?",
    blurb: "A giant wave sweeps everyone along and washes the field clean!",
    start(game, ev) {
      if (game.biome && game.biome.id === "kitchen") ev.blurb = "Someone left the sink running! Everything washes along.";
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.len = s(WAVE_LENGTH);
      ev.front0 = ev.dir > 0 ? -s(40) : W + s(40);
      ev.speed = (W + ev.len + s(80)) / ev.def.duration;
      ev.front = ev.front0;
      ev.ducks = [0.15, 0.4, 0.62, 0.85].map((k) => ({ k, bob: rand(0, 6) }));
      ev.dropped = 0;
      audio.play("wave_crash");
    },
    // Water height above the ground at x (0 outside the wave).
    height(ev, x) {
      const behind = (ev.front - x) * ev.dir;
      if (behind < 0 || behind > ev.len) return 0;
      const k = behind / ev.len;
      // Tall near the front, tapering off behind, with a gentle swell.
      return s(WAVE_HEIGHT) * (k < 0.12 ? 0.55 + (k / 0.12) * 0.45 : 1 - (k - 0.12) / 0.88 * 0.85) * (1 + 0.06 * Math.sin(ev.time * 6 + x * 0.03));
    },
    update(game, ev, dt) {
      ev.front = ev.front0 + ev.dir * ev.speed * ev.time;
      const h = (x) => ev.def.height(ev, x);
      for (const u of game.living()) {
        if (u.isBoss || u instanceof Airplane || u instanceof Castle || u.airborne) continue;
        const water = h(u.x);
        if (water > 0) {
          if (u.washed === undefined) {
            u.washed = 0;
            // At most one remark every second or so, so the speech bubbles stay readable.
            if (game.canSpeak(u) && ev.time >= (ev.nextLine || 0)) {
              u.say(choice(WAVE_LINES), 1.3);
              ev.nextLine = ev.time + rand(0.8, 1.4);
            }
          }
          const push = Math.min(s(WAVE_PUSH) - u.washed, ev.speed * 0.45 * dt * (u instanceof Tank ? 0.5 : 1));
          if (push > 0) {
            u.washed += push;
            u.x = clamp(u.x + ev.dir * push, s(45), W - s(45));
          }
          u.lift = water * (u instanceof Tank ? 0.25 : 0.45);
          u.stuck = 0;
        } else if (u.washed !== undefined && u.lift) {
          u.lift = 0;
        }
      }
      // Eggs flying into the water fizzle out.
      for (const e of [...game.eggs]) {
        const water = h(e.x);
        if (water > 0 && e.y >= game.terrain.yAt(e.x) - water) {
          Effects.spawn("drop", e.x, e.y, rand(-40, 40), rand(-120, -60), 0.4, 2.5, WHITE);
          game.removeEgg(e);
        }
      }
      for (const splat of game.splats) if (h(splat.x) > 0) splat.age = Math.max(splat.age, 13);
      for (const w of game.wreckage) {
        if ((w.kind !== "air_debris" || w.landed) && h(w.x) > 0) {
          w.x += ev.dir * ev.speed * 0.6 * dt;
          w.y = game.terrain.yAt(clamp(w.x, 0, W));
        }
      }
      for (const z of Hazards.zones) if (h(z.x) > 0 && z.def.period) z.timer = Math.max(z.timer, z.def.warn + 1);
      if (Math.random() < dt * 30) {
        const x = ev.front - ev.dir * rand(0, s(30));
        const y = game.terrain.yAt(clamp(x, 0, W)) - h(x);
        Effects.spawn("drop", x, y, ev.dir * rand(40, 140), rand(-200, -80), rand(0.4, 0.7), rand(2, 3.5), WHITE);
      }
      // Leave a couple of rubber ducks stranded once the wave has passed the middle.
      if (ev.dropped < 2 && (ev.front - W * (0.35 + ev.dropped * 0.3)) * ev.dir > 0) {
        ev.dropped++;
        Events.leftovers.push({ kind: "duck", x: ev.front - ev.dir * ev.len * rand(0.5, 0.9), bob: rand(0, 6), dir: ev.dir });
        audio.play("squeak");
      }
    },
    end(game) {
      for (const u of game.units) {
        if (u.washed !== undefined) {
          if (!u.airborne) u.lift = 0;
          delete u.washed;
        }
      }
    },
    draw(game, ev) {
      const h = (x) => ev.def.height(ev, x);
      const tail = ev.front - ev.dir * ev.len;
      const x0 = Math.min(tail, ev.front);
      const x1 = Math.max(tail, ev.front);
      const step = 8;
      const top = [];
      for (let x = x0; x <= x1; x += step) top.push([x, game.terrain.yAt(clamp(x, 0, W)) - h(x)]);
      top.push([x1, game.terrain.yAt(clamp(x1, 0, W)) - h(x1 - ev.dir * 0.5)]);
      ctx.save();
      ctx.beginPath();
      top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let x = x1; x >= x0; x -= step) ctx.lineTo(x, game.terrain.yAt(clamp(x, 0, W)) + 2);
      ctx.closePath();
      ctx.fillStyle = "rgba(90,160,225,0.55)";
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      // Curling crest at the front.
      const fy = game.terrain.yAt(clamp(ev.front, 0, W)) - s(WAVE_HEIGHT) * 0.95;
      const cx = ev.front - ev.dir * s(34);
      ctx.fillStyle = "rgba(90,160,225,0.75)";
      ctx.beginPath();
      ctx.arc(cx, fy + s(18), s(34), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(cx + ev.dir * s(8), fy + s(24), s(15), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Foam blobs and wavelets inside.
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) {
        const x = ev.front - ev.dir * (i / 9) * ev.len * 0.9;
        const y = game.terrain.yAt(clamp(x, 0, W)) - h(x);
        ctx.beginPath();
        ctx.arc(x, y, 4 + (i % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 10, y + h(x) * 0.5, 7, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      ctx.restore();
      for (const d of ev.ducks) {
        const x = ev.front - ev.dir * d.k * ev.len * 0.9;
        drawRubberDuck(x, game.terrain.yAt(clamp(x, 0, W)) - h(x) - 6 + Math.sin(ev.time * 5 + d.bob) * 3, ev.dir, Math.sin(ev.time * 4 + d.bob) * 0.25);
      }
    },
  },

  tornado: {
    id: "tornado",
    name: "TORNADO",
    minStage: 5,
    weight: 1,
    duration: 8,
    warn: "The wind is picking up...",
    blurb: "A twister! Light troops get tossed - tanks hold their ground.",
    start(game, ev) {
      ev.dir = Math.random() < 0.5 ? 1 : -1;
      ev.x0 = ev.dir > 0 ? -60 : W + 60;
      ev.speed = (W + 120) / ev.def.duration;
      ev.x = ev.x0;
      ev.nextHowl = 0;
      ev.phase2 = rand(0, Math.PI * 2);
    },
    update(game, ev, dt) {
      ev.x = ev.x0 + ev.dir * ev.speed * ev.time + Math.sin(ev.time * 1.3 + ev.phase2) * s(50);
      const ground = game.terrain.yAt(clamp(ev.x, 0, W));
      if (ev.time >= ev.nextHowl) {
        audio.play("wind_howl");
        ev.nextHowl += 1.6;
      }
      if (Math.random() < dt * 40) Effects.spawn("debris", ev.x + rand(-30, 30), ground - rand(0, 20), rand(-160, 160), rand(-260, -120), rand(0.5, 0.9), rand(5, 10), LINE);
      if (Math.random() < dt * 20) Effects.smoke(ev.x + rand(-25, 25), ground - 6, 1);
      const caught = game.units.filter((u) => u.caughtBy === ev).length;
      for (const u of game.living()) {
        if (u.isBoss) continue;
        if (u instanceof Airplane) {
          // Aircraft get buffeted sideways.
          if (Math.abs(u.x - ev.x) < s(110)) u.x += ev.dir * s(90) * dt;
          continue;
        }
        if (u.caughtBy === ev) {
          // Spin around the funnel while rising.
          u.spinT = (u.spinT || 0) + dt;
          u.lift = Math.min(u.liftTarget, (u.lift || 0) + s(160) * dt);
          u.x = clamp(ev.x + Math.sin(u.spinT * 6 + u.wobble) * s(40), s(45), W - s(45));
          u.spin = (u.spin || 0) + dt * 9;
          if (u.spinT >= u.holdTime) Events.release(u, ev.dir * rand(60, 180));
          continue;
        }
        const light = !(u instanceof Tank) && !(u instanceof Castle) && !u.heavy;
        if (!light || u.airborne || u.tossed || caught >= TORNADO_MAX_CAUGHT) continue;
        if (Math.abs(u.x - ev.x) < s(45)) {
          u.caughtBy = ev;
          u.tossed = true;
          u.airborne = true;
          u.spinT = 0;
          u.holdTime = rand(1, 1.8);
          u.liftTarget = rand(s(90), s(160));
          u.liftV = 0;
          if (game.canSpeak(u) && ev.time >= (ev.nextLine || 0)) {
            u.say(choice(TORNADO_LINES), 1.4);
            ev.nextLine = ev.time + rand(0.6, 1.1);
          }
        }
      }
      for (const e of game.eggs) {
        if (Math.abs(e.x - ev.x) > s(70) || e.y > ground) continue;
        e.vx += (ev.x - e.x) * 4 * dt + ev.dir * 120 * dt;
        e.vy -= 520 * dt;
      }
    },
    end(game, ev) {
      for (const u of game.units) if (u.caughtBy === ev) Events.release(u, ev.dir * rand(60, 160));
    },
    draw(game, ev) {
      const ground = game.terrain.yAt(clamp(ev.x, 0, W));
      const top = H * 0.16;
      const rings = 16;
      const fade = Math.min(1, ev.time * 2, (ev.def.duration - ev.time) * 2);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineWidth = 2;
      for (let i = 0; i <= rings; i++) {
        const k = i / rings;
        const yy = ground - k * (ground - top);
        const rx = s(10) + Math.pow(k, 1.6) * s(95);
        const cx = ev.x + Math.sin(ev.time * 4 + i * 0.55) * k * s(22);
        const a0 = ev.time * 7 + i;
        ctx.fillStyle = rgbaFromHex(LINE, 0.09);
        ctx.strokeStyle = rgbaFromHex(LINE, 0.55 + 0.35 * (1 - k));
        ctx.beginPath();
        ctx.ellipse(cx, yy, rx, rx * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, yy, rx, rx * 0.22, 0, a0 % (Math.PI * 2), (a0 % (Math.PI * 2)) + Math.PI * 1.3);
        ctx.stroke();
      }
      // Swirl streaks down the funnel.
      ctx.strokeStyle = rgbaFromHex(LINE, 0.45);
      ctx.lineWidth = 1.5;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        for (let i = 0; i <= rings; i++) {
          const k = i / rings;
          const yy = ground - k * (ground - top);
          const rx = s(10) + Math.pow(k, 1.6) * s(95);
          const cx = ev.x + Math.sin(ev.time * 4 + i * 0.55) * k * s(22);
          const px = cx + Math.sin(ev.time * 6 + j * 2.1 + k * 5) * rx * 0.8;
          if (i) ctx.lineTo(px, yy);
          else ctx.moveTo(px, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
    },
  },

  earthquake: {
    id: "earthquake",
    name: "EARTHQUAKE",
    minStage: 4,
    weight: 1,
    duration: 4,
    warn: "The ground is rumbling...",
    blurb: "The field shifts and everyone on the ground stumbles!",
    start(game, ev) {
      // A smooth random displacement, applied in a few jolts so the terrain art is only
      // redrawn a handful of times.
      const k1 = rand(1.5, 3.5);
      const k2 = rand(4, 7);
      const p1 = rand(0, Math.PI * 2);
      const p2 = rand(0, Math.PI * 2);
      const amp = s(24);
      ev.shift = (x) => (Math.sin((x / W) * Math.PI * k1 + p1) * 0.7 + Math.sin((x / W) * Math.PI * k2 + p2) * 0.3) * amp;
      ev.jolts = 0;
      ev.nextJolt = 0.3;
      audio.play("rumble");
    },
    update(game, ev, dt) {
      Effects.rumble(3 + 2 * Math.sin(ev.time * 9));
      if (ev.jolts >= QUAKE_JOLTS || ev.time < ev.nextJolt) return;
      ev.jolts++;
      ev.nextJolt += (ev.def.duration - 0.6) / QUAKE_JOLTS;
      const t = game.terrain;
      const floor = H * 0.93;
      const top = H * t.biome.terrain.minY - s(20);
      t.points = t.points.map(([x, y]) => [x, clamp(y + ev.shift(x) / QUAKE_JOLTS, top, floor)]);
      t.invalidate();
      for (let i = 0; i < 6; i++) {
        const x = rand(0, W);
        Effects.debris(x, t.yAt(x), 2, LINE);
        Effects.smoke(x, t.yAt(x), 2);
      }
      for (const w of game.wreckage) if (w.kind !== "air_debris" || w.landed) w.y = t.yAt(w.x);
      // Splats on the ground pop off in little yolk sprays.
      for (const splat of game.splats) {
        if (Math.random() < 0.35) {
          Effects.yolk(splat.x, splat.y, 3, 0.7);
          splat.age = Math.max(splat.age, 13);
        }
      }
      for (const u of game.living()) if (Hazards.isGround(u)) u.stagger = 0.9;
      // One startled remark per jolt, from either army.
      const talkers = game.living().filter((u) => Hazards.isGround(u) && game.canSpeak(u));
      if (talkers.length) choice(talkers).say(choice(QUAKE_LINES), 1.3);
      audio.play("rumble");
    },
    draw(game, ev) {
      // Cartoon "RUMBLE" lettering bouncing along the ground.
      ctx.save();
      ctx.globalAlpha = 0.75 * Math.min(1, (ev.def.duration - ev.time) * 2);
      ctx.fillStyle = LINE;
      ctx.font = "bold 30px Courier New";
      const letters = "RUMBLE";
      const x0 = W / 2 - 100;
      for (let i = 0; i < letters.length; i++) {
        const j = Math.sin(ev.time * 30 + i * 1.7) * 4;
        ctx.fillText(letters[i], x0 + i * 34 + j, H * 0.45 + Math.cos(ev.time * 25 + i) * 5);
      }
      ctx.restore();
    },
  },
};

// A little yellow rubber duck, used by the tsunami (and left behind on the field afterwards).
function drawRubberDuck(x, y, dir = 1, tilt = 0, r = 9) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(dir, 1);
  ctx.fillStyle = "#ffd23a";
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.2, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.7, -r * 0.8, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ff8a2a";
  ctx.beginPath();
  ctx.moveTo(r * 1.15, -r * 0.85);
  ctx.lineTo(r * 1.65, -r * 0.7);
  ctx.lineTo(r * 1.15, -r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(r * 0.85, -r * 0.95, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHen(x, y, dir, phase, k = 1) {
  const r = s(11) * k;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  // Legs scissoring.
  const leg = Math.sin(phase) * r * 0.5;
  line(-r * 0.2, -r * 0.6, -r * 0.2 + leg, 0, LINE, 1.5);
  line(r * 0.2, -r * 0.6, r * 0.2 - leg, 0, LINE, 1.5);
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.1, r, r * 0.7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Head, comb and beak.
  ctx.beginPath();
  ctx.arc(r * 0.9, -r * 1.75, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e0402a";
  ctx.beginPath();
  ctx.arc(r * 0.85, -r * 2.2, r * 0.18, 0, Math.PI * 2);
  ctx.arc(r * 1.05, -r * 2.15, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffb52a";
  ctx.beginPath();
  ctx.moveTo(r * 1.3, -r * 1.85);
  ctx.lineTo(r * 1.7, -r * 1.72);
  ctx.lineTo(r * 1.3, -r * 1.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.arc(r * 1.0, -r * 1.85, 1.3, 0, Math.PI * 2);
  ctx.fill();
  // Flapping wing.
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 1.2);
  ctx.quadraticCurveTo(-r * 0.9, -r * (1.4 + Math.sin(phase * 1.3) * 0.6), -r * 1.1, -r * 0.9);
  ctx.stroke();
  ctx.restore();
}

function drawUfo(x, y, t) {
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(170,230,255,0.8)";
  ctx.beginPath();
  ctx.ellipse(x, y - s(8), s(18), s(14), 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#b8bcc6";
  ctx.beginPath();
  ctx.ellipse(x, y, s(46), s(12), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = Math.floor(t * 6 + i) % 2 ? YOLK : "#ff6a6a";
    ctx.beginPath();
    ctx.arc(x - s(32) + i * s(16), y + s(2), s(3), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCow(x, y, t) {
  const r = s(22);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  for (const lx of [-r * 0.9, -r * 0.4, r * 0.4, r * 0.9]) line(lx, -r * 0.5, lx, 0, LINE, 2);
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.0, r * 1.4, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.beginPath();
  ctx.ellipse(-r * 0.5, -r * 1.1, r * 0.35, r * 0.25, 0.4, 0, Math.PI * 2);
  ctx.ellipse(r * 0.4, -r * 0.8, r * 0.25, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.ellipse(r * 1.5, -r * 1.35 + Math.sin(t * 2) * 1.5, r * 0.45, r * 0.38, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2a5a5";
  ctx.beginPath();
  ctx.ellipse(r * 1.75, -r * 1.25, r * 0.22, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const Events = {
  current: null,
  leftovers: [],

  reset() {
    this.current = null;
    this.leftovers = [];
  },

  updateLeftovers(game, dt) {
    for (const d of this.leftovers) {
      if (d.kind !== "cow") continue;
      const ground = game.terrain.yAt(clamp(d.x, 0, W));
      if (d.moo > 0) d.moo -= dt;
      if (d.landed) {
        d.y = ground;
        continue;
      }
      d.vy += GRAVITY * 0.6 * dt;
      d.y = Math.min(ground, d.y + d.vy * dt);
      if (d.y >= ground) {
        d.landed = true;
        d.moo = 1.5;
        Effects.smoke(d.x, ground, 4);
        audio.play("moo");
      }
    }
  },

  update(game, dt) {
    this.updateLeftovers(game, dt);
    const plan = Director.plan;
    if (!this.current && plan && plan.event && !plan.done && game.roundTime >= plan.eventAt - EVENT_WARN_SECONDS && !game.personalityTimer && !game.rallyTimer) {
      plan.done = true;
      const def = EVENT_TYPES[plan.event];
      this.current = { def, phase: "warn", timer: EVENT_WARN_SECONDS, time: 0, banner: EVENT_WARN_SECONDS + 1.6 };
      audio.play("event_warn");
    }
    const ev = this.current;
    if (!ev) return;
    ev.banner = Math.max(0, ev.banner - dt);
    if (ev.phase === "over") {
      if (ev.banner <= 0) this.current = null;
      return;
    }
    if (ev.phase === "warn") {
      ev.timer -= dt;
      if (ev.timer > 0) return;
      ev.phase = "run";
      const flags = Director.flags();
      flags.lastEvent = ev.def.id;
      Director.markSeen(`event:${ev.def.id}`);
      Stats.add("eventsSurvived");
      if (ev.def.start) ev.def.start(game, ev);
      return;
    }
    ev.time += dt;
    if (ev.def.update) ev.def.update(game, ev, dt);
    if (ev.time >= ev.def.duration) {
      if (ev.def.end) ev.def.end(game, ev);
      ev.phase = "over";
    }
  },

  // Movement multiplier for a unit this frame (events can slow units down).
  speedFactor(u) {
    if (u.knock > 0) return 0;
    return u.stagger > 0 ? 0.35 : 1;
  },

  // Lets go of a unit held by an event; it is flung sideways and falls back to the ground.
  release(u, vx) {
    u.caughtBy = null;
    u.liftV = rand(60, 160);
    u.flingVx = vx;
  },

  // Per-unit event state. Returns true while the unit is off the ground (it can't move or fire).
  tickUnit(game, u, dt) {
    if (u.stagger > 0) u.stagger = Math.max(0, u.stagger - dt);
    if (u.knock > 0) u.knock = Math.max(0, u.knock - dt);
    if (!u.airborne) return false;
    if (u.caughtBy) return true;
    if (u.parachute) {
      // Chick paratroopers float gently down and land unhurt.
      u.lift = Math.max(0, u.lift - s(CHICK_FALL_SPEED) * dt);
      u.spin = Math.sin(performance.now() * 0.004 + u.wobble) * 0.15;
      if (u.lift <= 0) {
        u.parachute = false;
        u.airborne = false;
        u.spin = 0;
      }
      return true;
    }
    u.liftV -= GRAVITY * 0.8 * dt;
    u.lift += u.liftV * dt;
    u.x = clamp(u.x + (u.flingVx || 0) * dt, s(45), W - s(45));
    u.spin = (u.spin || 0) + dt * 8;
    if (u.lift <= 0) {
      u.lift = 0;
      u.spin = 0;
      u.airborne = false;
      Effects.smoke(u.x, u.y + u.groundOffset, 3);
      audio.play("egg_splat");
      game.damageUnit(u, 1);
    }
    return true;
  },

  // Draws a unit tumbling when it is in the air.
  drawUnit(u, drawFn) {
    // Knocked-over units tip onto their back for a moment, then pop back up.
    const tip = u.knock > 0 ? u.knockDir * (Math.PI / 2) * Math.min(1, u.knock * 4) : 0;
    if (!u.spin && !tip && !u.parachute) {
      drawFn();
      return;
    }
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate((u.spin || 0) + tip);
    ctx.translate(-u.x, -u.y);
    drawFn();
    if (u.parachute) {
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.2;
      ctx.fillStyle = WHITE;
      const top = u.y - s(48);
      ctx.beginPath();
      ctx.arc(u.x, top, s(16), Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      line(u.x - s(16), top, u.x, u.y - s(14), LINE, 1);
      line(u.x + s(16), top, u.x, u.y - s(14), LINE, 1);
    }
    ctx.restore();
  },

  // World-space drawing (inside the screen shake).
  draw(game) {
    for (const d of this.leftovers) {
      if (d.kind === "duck") drawRubberDuck(d.x, game.terrain.yAt(clamp(d.x, 0, W)) - 6, d.dir, Math.sin(performance.now() * 0.002 + d.bob) * 0.08);
      if (d.kind === "cow") {
        drawCow(d.x, d.y, performance.now() * 0.001 + d.bob);
        if (d.moo > 0) {
          ctx.fillStyle = LINE;
          ctx.font = "bold 16px Courier New";
          ctx.fillText("MOO.", d.x + s(18), d.y - s(30));
        }
      }
    }
    const ev = this.current;
    if (ev && ev.phase === "run" && ev.def.draw) ev.def.draw(game, ev);
  },

  drawBanner(game) {
    const ev = this.current;
    if (!ev || ev.banner <= 0 || game.winner || game.scene !== "battle") return;
    const warning = ev.phase === "warn";
    const title = warning ? "! ! !" : `${ev.def.name}!`;
    const text = warning ? ev.def.warn : ev.blurb || ev.def.blurb;
    ctx.save();
    ctx.globalAlpha = Math.min(1, ev.banner / 0.5);
    ctx.font = "bold 28px Courier New";
    const titleW = ctx.measureText(title).width;
    ctx.font = "bold 16px Courier New";
    const w = Math.max(titleW, ctx.measureText(text).width) + 40;
    const x = (W - w) / 2;
    const y = 186;
    const wobble = warning ? Math.sin(performance.now() * 0.03) * 2 : 0;
    ctx.translate(wobble, 0);
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, 62);
    ctx.strokeRect(x, y, w, 62);
    ctx.fillStyle = rgbaFromHex(YOLK, 0.9);
    ctx.fillRect(x, y, w, 8);
    ctx.strokeRect(x, y, w, 8);
    ctx.fillStyle = LINE;
    ctx.font = "bold 28px Courier New";
    centerText(title, y + 37);
    ctx.font = "bold 16px Courier New";
    centerText(text, y + 55);
    ctx.restore();
  },
};

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

const EVENT_TYPES = {
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
        const light = !(u instanceof Tank) && !(u instanceof Castle);
        if (!light || u.airborne || u.tossed || caught >= TORNADO_MAX_CAUGHT) continue;
        if (Math.abs(u.x - ev.x) < s(45)) {
          u.caughtBy = ev;
          u.tossed = true;
          u.airborne = true;
          u.spinT = 0;
          u.holdTime = rand(1, 1.8);
          u.liftTarget = rand(s(90), s(160));
          u.liftV = 0;
          if (game.canSpeak(u) || Math.random() < 0.3) u.say(choice(TORNADO_LINES), 1.4);
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

const Events = {
  current: null,

  reset() {
    this.current = null;
  },

  update(game, dt) {
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
    if (!u.airborne) return false;
    if (u.caughtBy) return true;
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
    if (!u.spin) {
      drawFn();
      return;
    }
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.rotate(u.spin);
    ctx.translate(-u.x, -u.y);
    drawFn();
    ctx.restore();
  },

  // World-space drawing (inside the screen shake).
  draw(game) {
    const ev = this.current;
    if (ev && ev.phase === "run" && ev.def.draw) ev.def.draw(game, ev);
  },

  drawBanner(game) {
    const ev = this.current;
    if (!ev || ev.banner <= 0 || game.winner || game.scene !== "battle") return;
    const warning = ev.phase === "warn";
    const title = warning ? "! ! !" : `${ev.def.name}!`;
    const text = warning ? ev.def.warn : ev.def.blurb;
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

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

const EVENT_TYPES = {
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

  tickUnit(u, dt) {
    if (u.stagger > 0) u.stagger = Math.max(0, u.stagger - dt);
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

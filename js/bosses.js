"use strict";

// Boss battles: every 5th stage the enemy brings a boss that takes 40% of its point budget
// (DESIGN.md section 3), so a boss stage is a different fight, not a harder one.
// Bosses have two phases: below half health they attack faster and add a special move.

const BOSS_EVERY = 5;
const BOSS_BUDGET_SHARE = 0.4;
// Hit points per threat point, matching ordinary units (a 10-point tank has 5 HP).
const BOSS_HP_PER_POINT = 0.5;
// Boss stages get extra time, and the boss counts half its HP in the timeout tiebreak.
const BOSS_EXTRA_SECONDS = 18;
const BOSS_SCORE_WEIGHT = 0.5;

class Boss extends Unit {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain);
    this.isBoss = true;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.attackClock = 2.5;
    this.specialClock = 6;
    this.fireRate = 0;
  }

  get enraged() {
    return this.hp <= this.maxHp / 2;
  }

  // Bosses attack on their own clocks instead of the normal fire roll.
  ready() {
    return false;
  }

  updateBoss(game, dt, enemies) {
    this.attackClock -= dt;
    this.specialClock -= dt;
    if (this.attackClock <= 0) {
      this.attackClock = this.enraged ? this.fastAttack : this.slowAttack;
      this.attack(game, enemies);
    }
    if (this.enraged && this.specialClock <= 0) {
      this.specialClock = this.specialEvery;
      this.special(game, enemies);
    }
  }
}

// Giant Rooster Mech: stomps forward, lobs bursting eggs, and when enraged stomps the ground.
class RoosterMech extends Boss {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain, maxHp);
    this.name = "GIANT ROOSTER MECH";
    this.speed = 7;
    this.size = s(150);
    this.groundOffset = s(90);
    this.slowAttack = 3.2;
    this.fastAttack = 2.2;
    this.specialEvery = 7;
  }

  radius() {
    return this.size * 0.55;
  }

  blockingRadius() {
    return this.size * 0.4;
  }

  attack(game, enemies) {
    const ground = enemies.filter((e) => !(e instanceof Airplane));
    const targets = (ground.length ? ground : enemies).slice().sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x)).slice(0, 2);
    targets.forEach((t, i) => game.lobEgg(this.x - this.side * s(30), this.y - s(70), t.x + rand(-30, 30), t.y, this.side, 2, 1.4 + i * 0.25));
    this.recoil = 1;
    audio.play("fire");
  }

  special(game, enemies) {
    // Ground stomp: shakes the field and hits nearby ground units.
    Effects.shake(10);
    Effects.spawn("ring", this.x, this.terrain.yAt(this.x), 0, 0, 0.5, 30, YOLK);
    audio.play("tank_destroyed");
    for (const e of enemies) {
      if (!(e instanceof Airplane) && Math.abs(e.x - this.x) < s(260)) game.damageUnit(e, 1);
    }
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const ground = this.terrain.yAt(x);
    const step = Math.sin(performance.now() * 0.004 + this.wobble);
    const bodyY = ground - s(110) + Math.abs(step) * s(4);
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(3);
    // Legs.
    line(x - s(20), bodyY + s(30), x - s(30) + step * s(12), ground, c, sw(5));
    line(x + s(20), bodyY + s(30), x + s(30) - step * s(12), ground, c, sw(5));
    // Body.
    ctx.beginPath();
    ctx.ellipse(x, bodyY, s(62), s(42), 0, 0, Math.PI * 2);
    teamFill(c, 0.35);
    ctx.stroke();
    // Rivets.
    for (let i = -2; i <= 2; i++) circle(x + i * s(18), bodyY + s(18), s(3), c);
    // Tail feathers (metal plates).
    for (let i = 0; i < 4; i++) {
      line(x - this.side * s(55), bodyY - s(10), x - this.side * s(95 + i * 6), bodyY - s(70 - i * 20), i % 2 ? RED : c, sw(4));
    }
    // Neck and head.
    const hx = x + this.side * s(58);
    const hy = bodyY - s(60);
    line(x + this.side * s(40), bodyY - s(20), hx, hy + s(15), c, sw(5));
    ctx.beginPath();
    ctx.arc(hx, hy, s(20), 0, Math.PI * 2);
    teamFill(c, 0.35);
    ctx.stroke();
    // Comb and beak.
    ctx.fillStyle = RED;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(hx - this.side * s(8) + this.side * i * s(9), hy - s(22), s(7), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = YOLK;
    ctx.beginPath();
    ctx.moveTo(hx + this.side * s(16), hy - s(4));
    ctx.lineTo(hx + this.side * s(38), hy + s(2));
    ctx.lineTo(hx + this.side * s(16), hy + s(8));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Glowing eye (red when enraged).
    ctx.fillStyle = this.enraged ? RED : YOLK;
    ctx.beginPath();
    ctx.arc(hx + this.side * s(6), hy - s(4), s(5), 0, Math.PI * 2);
    ctx.fill();
    // Egg cannon on its back.
    line(x - this.side * s(10), bodyY - s(30), x - this.side * s(36), bodyY - s(72) + (this.recoil || 0) * s(8), LINE, sw(9));
    ctx.restore();
  }
}

// Omelet Fortress: a giant stationary castle that fires spreading volleys and, when enraged,
// launches drones.
class OmeletFortress extends Boss {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain, maxHp);
    this.name = "OMELET FORTRESS";
    this.speed = 0;
    this.size = s(170);
    this.width = s(150);
    this.height = s(220);
    this.slowAttack = 3.4;
    this.fastAttack = 2.4;
    this.specialEvery = 8;
  }

  get y() {
    return this.terrain.yAt(this.x) - this.height * 0.5;
  }

  radius() {
    return this.size * 0.6;
  }

  blockingRadius() {
    return this.width * 0.55;
  }

  move() {}

  attack(game, enemies) {
    const top = this.terrain.yAt(this.x) - this.height;
    const count = this.enraged ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const tx = W * 0.08 + (i + Math.random() * 0.5) * (W * 0.55 / count);
      game.lobEgg(this.x, top - s(20), tx, game.terrain.yAt(tx), this.side, 1, 1.8 + Math.random() * 0.5);
    }
    Effects.muzzle(this.x, top - s(20), -this.side);
    audio.play("fire");
  }

  special(game) {
    for (let i = 0; i < 2; i++) {
      const drone = game.addUnit(this.side, "drone");
      if (drone) drone.x = this.x;
    }
    audio.play("coin");
  }

  draw() {
    const c = teamColor(this.side);
    const ground = this.terrain.yAt(this.x);
    const left = this.x - this.width / 2;
    const right = this.x + this.width / 2;
    const top = ground - this.height;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(3);
    // Main keep.
    ctx.beginPath();
    ctx.rect(left, top + s(30), this.width, this.height - s(30));
    teamFill(c, 0.2);
    ctx.stroke();
    // Two towers.
    for (const tx of [left - s(10), right - s(30)]) {
      ctx.beginPath();
      ctx.rect(tx, top, s(40), this.height);
      teamFill(c, 0.25);
      ctx.stroke();
      for (let k = 0; k < 3; k++) ctx.strokeRect(tx + k * s(14), top - s(10), s(10), s(10));
    }
    // Giant frying-pan gate.
    ctx.beginPath();
    ctx.arc(this.x, ground - s(40), s(36), 0, Math.PI * 2);
    ctx.fillStyle = rgbaFromHex(LINE, 0.25);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(this.x, ground - s(40), s(22), s(16), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = YOLK;
    ctx.beginPath();
    ctx.arc(this.x + s(3), ground - s(42), s(9), 0, Math.PI * 2);
    ctx.fill();
    // Windows glowing when enraged.
    ctx.fillStyle = this.enraged ? RED : rgbaFromHex(LINE, 0.4);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) ctx.fillRect(left + s(30) + col * s(32), top + s(60) + row * s(40), s(10), s(16));
    }
    // Big flag.
    drawFlag(this.x, top + s(30), s(70), c, this.side);
    ctx.restore();
  }
}

// Scrambler Zeppelin: drifts over the battlefield dropping egg bombs; enraged it speeds up and
// drops clusters.
class ScramblerZeppelin extends Airplane {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain, 0);
    this.isBoss = true;
    this.name = "SCRAMBLER ZEPPELIN";
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.size = s(180);
    this.flightY = H * 0.28;
    this.speed = 45;
    this.dir = -1;
    this.fireRate = 0;
    this.attackClock = 1.5;
    this.specialClock = 5;
    this.slowAttack = 1.0;
    this.fastAttack = 0.6;
    this.specialEvery = 5;
  }

  get enraged() {
    return this.hp <= this.maxHp / 2;
  }

  radius() {
    return this.size * 0.5;
  }

  ready() {
    return false;
  }

  move(dt) {
    const speed = this.speed * (this.enraged ? 1.6 : 1);
    this.x += this.dir * speed * dt;
    if (this.x < W * 0.22) this.dir = 1;
    if (this.x > W * 0.82) this.dir = -1;
    this.flightY = H * 0.28 + Math.sin(performance.now() * 0.001) * 8;
  }

  updateBoss(game, dt, enemies) {
    Boss.prototype.updateBoss.call(this, game, dt, enemies);
  }

  attack(game) {
    game.eggs.push(new Egg(this.x, this.y + s(50), this.dir * 20, 40, this.side, this.enraged ? 3 : 1));
    audio.play("fire");
  }

  special(game) {
    game.eggs.push(new Egg(this.x, this.y + s(50), 0, 30, this.side, 0, "cluster"));
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(3);
    // Envelope (an egg on its side).
    ctx.beginPath();
    ctx.ellipse(x, y, s(110), s(46), 0, 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
    ctx.fill();
    teamFill(c, 0.15);
    ctx.stroke();
    // Seams and a big painted yolk.
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(x, y, s(110), s(46) * (0.35 + Math.abs(i) * 0.3), 0, -Math.PI, 0);
      ctx.stroke();
    }
    ctx.fillStyle = this.enraged ? RED : YOLK;
    ctx.beginPath();
    ctx.arc(x, y + s(4), s(18), 0, Math.PI * 2);
    ctx.fill();
    // Fins.
    const back = x - this.dir * s(105);
    line(back, y, back - this.dir * s(30), y - s(34), c, sw(3));
    line(back, y, back - this.dir * s(30), y + s(34), c, sw(3));
    // Gondola.
    line(x - s(30), y + s(42), x - s(24), y + s(58), c);
    line(x + s(30), y + s(42), x + s(24), y + s(58), c);
    ctx.beginPath();
    ctx.rect(x - s(34), y + s(58), s(68), s(18));
    teamFill(c, 0.4);
    ctx.stroke();
    // Propeller.
    const spin = Math.cos(performance.now() * 0.05) * s(16);
    line(back - this.dir * s(4), y - spin, back - this.dir * s(4), y + spin, LINE, sw(2));
    ctx.restore();
  }
}

// Mother Hen Queen: a giant crowned hen. She lays eggs that hatch into chick soldiers, lobs eggs,
// and when enraged flaps her wings: a gust that blows the player's eggs back and shoves troops.
const HEN_MAX_CHICKS = 8;
const HEN_GUST_RANGE = 420;

class HenQueen extends Boss {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain, maxHp);
    this.name = "MOTHER HEN QUEEN";
    this.speed = 4;
    this.size = s(140);
    this.groundOffset = s(62);
    this.slowAttack = 3.0;
    this.fastAttack = 2.0;
    this.specialEvery = 7;
    this.layNext = true;
    this.flap = 0;
  }

  radius() {
    return this.size * 0.5;
  }

  blockingRadius() {
    return this.size * 0.38;
  }

  attack(game, enemies) {
    this.layNext = !this.layNext;
    const chicks = game.living(this.side).filter((u) => u.chick).length;
    if (!this.layNext && chicks < HEN_MAX_CHICKS) {
      // Lay an egg that hatches into two chicks right away.
      const ex = this.x - this.side * s(40);
      for (let i = 0; i < 2; i++) {
        const chick = new Soldier(ex + this.side * s(20) * i, this.side, this.terrain);
        chick.hp = 1;
        chick.size *= 0.75;
        chick.visualScale = 0.75;
        chick.chick = true;
        game.units.push(chick);
      }
      Effects.shells(ex, this.terrain.yAt(ex) - s(10), 3);
      audio.play("bawk");
      if (game.canSpeak(this)) this.say("Go, my darlings!", 1.4);
      return;
    }
    const ground = enemies.filter((e) => !(e instanceof Airplane));
    const targets = (ground.length ? ground : enemies).slice().sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x)).slice(0, 3);
    targets.forEach((t, i) => game.lobEgg(this.x + this.side * s(40), this.y - s(60), t.x + rand(-30, 30), t.y, this.side, 1, 1.5 + i * 0.2));
    audio.play("fire");
  }

  special(game, enemies) {
    // Wing gust: the player's eggs fly back where they came from, and nearby troops get shoved.
    this.flap = 1.2;
    for (const e of game.eggs) {
      if (e.side === this.side) continue;
      e.vx = this.side * Math.abs(e.vx) * 1.1 + this.side * 80;
      e.vy = Math.min(e.vy, -60);
    }
    for (const u of enemies) {
      if (u instanceof Airplane || u.isBoss || u instanceof Castle || Math.abs(u.x - this.x) > s(HEN_GUST_RANGE)) continue;
      u.x = clamp(u.x + this.side * s(45), s(45), W - s(45));
      u.stagger = Math.max(u.stagger || 0, 0.6);
    }
    for (let i = 0; i < 14; i++) Effects.spawn("debris", this.x + this.side * rand(20, 120), this.y - rand(0, 80), this.side * rand(220, 380), rand(-40, 40), 0.6, 6, WHITE);
    audio.play("wind_howl");
    if (game.canSpeak(this)) this.say("SHOO!", 1.2);
  }

  updateBoss(game, dt, enemies) {
    this.flap = Math.max(0, this.flap - dt);
    super.updateBoss(game, dt, enemies);
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const ground = this.terrain.yAt(x);
    const t = performance.now() * 0.003 + this.wobble;
    const bodyY = ground - s(64) + Math.sin(t) * s(2);
    const d = this.side;
    ctx.save();
    ctx.lineWidth = sw(3);
    ctx.strokeStyle = c;
    // Nest.
    ctx.fillStyle = "#c79a5a";
    ctx.beginPath();
    ctx.ellipse(x, ground - s(8), s(80), s(18), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();
    for (let i = -3; i <= 3; i++) line(x + i * s(20) - s(10), ground - s(16), x + i * s(20) + s(10), ground - s(2), LINE, sw(1));
    // Body.
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, bodyY, s(70), s(50), 0, 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
    ctx.fill();
    teamFill(c, 0.18);
    ctx.stroke();
    // Tail feathers.
    for (let i = 0; i < 3; i++) line(x - d * s(60), bodyY - s(10), x - d * s(95), bodyY - s(50 - i * 22), c, sw(4));
    // Wing: flaps hard during a gust.
    const wing = this.flap > 0 ? Math.sin(this.flap * 30) * 0.9 : Math.sin(t * 0.7) * 0.1;
    ctx.save();
    ctx.translate(x - d * s(5), bodyY - s(8));
    ctx.rotate(-d * wing);
    ctx.beginPath();
    ctx.ellipse(-d * s(10), s(4), s(42), s(22), -d * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    teamFill(c, 0.3);
    ctx.stroke();
    ctx.restore();
    // Head, crown, beak, wattle.
    const hx = x + d * s(62);
    const hy = bodyY - s(52);
    ctx.beginPath();
    ctx.arc(hx, hy, s(24), 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = YOLK;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.moveTo(hx - s(16), hy - s(18));
    ctx.lineTo(hx - s(16), hy - s(40));
    ctx.lineTo(hx - s(8), hy - s(28));
    ctx.lineTo(hx, hy - s(44));
    ctx.lineTo(hx + s(8), hy - s(28));
    ctx.lineTo(hx + s(16), hy - s(40));
    ctx.lineTo(hx + s(16), hy - s(18));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx + d * s(20), hy - s(4));
    ctx.lineTo(hx + d * s(42), hy + s(3));
    ctx.lineTo(hx + d * s(20), hy + s(10));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.ellipse(hx + d * s(14), hy + s(18), s(6), s(9), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.enraged ? RED : LINE;
    ctx.beginPath();
    ctx.arc(hx + d * s(8), hy - s(6), s(4), 0, Math.PI * 2);
    ctx.fill();
    if (this.enraged) line(hx + d * s(2), hy - s(14), hx + d * s(16), hy - s(10), LINE, sw(2));
    // Gust lines.
    if (this.flap > 0) {
      ctx.globalAlpha = Math.min(1, this.flap);
      for (let i = 0; i < 5; i++) {
        const gy = bodyY - s(80) + i * s(30);
        const gx = x + d * (s(100) + ((1.2 - this.flap) * s(500)) % s(300));
        line(gx, gy, gx + d * s(70), gy, LINE, sw(2));
      }
    }
    ctx.restore();
  }
}

// Sink Kraken: lurks under the ground and slams tentacles up under the player's troops (a cracked
// ring warns first). Every so often it surfaces: only then does it take full damage.
const KRAKEN_DIVE_SECONDS = 7;
const KRAKEN_SURFACE_SECONDS = 3.5;
const KRAKEN_TENTACLE_WARN = 1.2;
const KRAKEN_TENTACLE_RADIUS = 40;
const KRAKEN_SUBMERGED_BLOCK = 0.85;

class SinkKraken extends Boss {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain, maxHp);
    this.name = "SINK KRAKEN";
    this.speed = 0;
    this.size = s(130);
    this.groundOffset = s(20);
    this.slowAttack = 2.6;
    this.fastAttack = 1.7;
    this.specialEvery = 6;
    this.submerged = true;
    this.phaseTimer = KRAKEN_DIVE_SECONDS;
    this.rise = 0;
    this.tentacles = [];
  }

  get y() {
    return this.terrain.yAt(this.x) - this.groundOffset - this.rise * s(70);
  }

  radius() {
    return this.size * 0.45;
  }

  blockingRadius() {
    return this.size * 0.35;
  }

  move() {}

  // While submerged, most hits just splash off the water.
  takeHit() {
    if (this.submerged && Math.random() < KRAKEN_SUBMERGED_BLOCK) {
      Effects.spawn("drop", this.x + rand(-30, 30), this.y - s(10), rand(-60, 60), rand(-160, -80), 0.5, 3, "#5aa8e0");
      return;
    }
    super.takeHit();
  }

  attack(game, enemies) {
    // A tentacle bursts up under a random ground unit.
    const ground = enemies.filter((e) => !(e instanceof Airplane) && !(e instanceof Castle));
    const pool = ground.length ? ground : enemies.filter((e) => !(e instanceof Airplane));
    if (!pool.length) return;
    const count = this.enraged ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const t = choice(pool);
      this.tentacles.push({ x: clamp(t.x + rand(-15, 15), s(60), W - s(60)), timer: KRAKEN_TENTACLE_WARN, up: 0 });
    }
  }

  special(game, enemies) {
    // Ink spray: a fan of eggs from wherever it is.
    for (let i = 0; i < 5; i++) {
      const tx = this.x + this.side * s(150 + i * 90);
      game.lobEgg(this.x, this.y - s(30), tx, this.terrain.yAt(clamp(tx, 0, W)), this.side, 1, 1.4 + i * 0.12);
    }
    audio.play("egg_splat");
  }

  updateBoss(game, dt, enemies) {
    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) {
      this.submerged = !this.submerged;
      this.phaseTimer = this.submerged ? KRAKEN_DIVE_SECONDS : KRAKEN_SURFACE_SECONDS;
      Effects.spawn("ring", this.x, this.terrain.yAt(this.x), 0, 0, 0.5, 30, "#5aa8e0");
      audio.play("wave_crash");
      if (!this.submerged && game.canSpeak(this)) this.say("BLUB BLUB!", 1.3);
    }
    this.rise = clamp(this.rise + (this.submerged ? -dt : dt) * 2, 0, 1);
    for (const tn of this.tentacles) {
      tn.timer -= dt;
      if (tn.timer <= 0 && !tn.hit) {
        tn.hit = true;
        const r = s(KRAKEN_TENTACLE_RADIUS);
        for (const u of enemies) {
          if (!(u instanceof Airplane) && Math.abs(u.x - tn.x) <= r + u.blockingRadius() * 0.5) game.damageUnit(u, 1);
        }
        Effects.debris(tn.x, this.terrain.yAt(tn.x), 6, LINE);
        audio.play("tank_hit");
      }
      if (tn.hit) tn.up = Math.min(1, tn.up + dt * 6);
    }
    this.tentacles = this.tentacles.filter((tn) => tn.timer > -1);
    // The tentacle attacks keep coming while it is under; on the surface it sprays ink instead.
    if (this.submerged || this.enraged) super.updateBoss(game, dt, enemies);
    else {
      this.specialClock -= dt;
      if (this.specialClock <= 0) {
        this.specialClock = this.specialEvery * 0.6;
        this.special(game, enemies);
      }
    }
  }

  draw() {
    const c = teamColor(this.side);
    const ground = this.terrain.yAt(this.x);
    const t = performance.now() * 0.003;
    ctx.save();
    // Puddle it hides in.
    ctx.fillStyle = "rgba(90,160,225,0.55)";
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.ellipse(this.x, ground - s(2), s(85), s(14), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Head and eyes, rising out of the puddle.
    if (this.rise > 0.02) {
      const hy = ground - s(10) - this.rise * s(75);
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x - s(90), 0, s(180), ground - s(2));
      ctx.clip();
      ctx.strokeStyle = c;
      ctx.lineWidth = sw(3);
      ctx.beginPath();
      ctx.ellipse(this.x, hy, s(55), s(62), 0, 0, Math.PI * 2);
      ctx.fillStyle = "#e9a7c9";
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 5; i++) circle(this.x - s(30) + i * s(15), hy - s(30) + (i % 2) * s(8), s(4), c);
      for (const ex of [-1, 1]) {
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(this.x + ex * s(20), hy + s(8), s(12), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = this.enraged ? RED : LINE;
        ctx.beginPath();
        ctx.arc(this.x + ex * s(20) + this.side * s(4), hy + s(10), s(5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Bubbles while it lurks.
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const by = ground - s(6) - ((t * 30 + i * 13) % s(40));
        ctx.beginPath();
        ctx.arc(this.x - s(30) + i * s(20), by, s(3), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // Arms waving at the puddle's edge.
    for (const ex of [-1, 1]) {
      const bx = this.x + ex * s(70);
      ctx.strokeStyle = c;
      ctx.lineWidth = sw(7);
      ctx.beginPath();
      ctx.moveTo(bx, ground);
      ctx.quadraticCurveTo(bx + ex * s(20), ground - s(40), bx + ex * s(10) + Math.sin(t * 2 + ex) * s(14), ground - s(60) - this.rise * s(20));
      ctx.stroke();
    }
    // Tentacle attacks.
    for (const tn of this.tentacles) {
      const g = this.terrain.yAt(tn.x);
      if (!tn.hit) {
        const on = Math.floor(tn.timer * 10) % 2 === 0;
        ctx.globalAlpha = on ? 0.9 : 0.4;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = sw(2);
        ctx.beginPath();
        ctx.ellipse(tn.x, g, s(KRAKEN_TENTACLE_RADIUS), s(8), 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let k = 0; k < 4; k++) line(tn.x, g, tn.x + Math.cos(k * 1.6) * s(30), g + Math.sin(k * 1.6) * s(6), LINE, sw(1));
        ctx.globalAlpha = 1;
        continue;
      }
      const h = s(110) * tn.up * Math.min(1, (tn.timer + 1) * 2);
      ctx.strokeStyle = c;
      ctx.lineWidth = sw(10);
      ctx.beginPath();
      ctx.moveTo(tn.x, g);
      ctx.quadraticCurveTo(tn.x + s(24), g - h * 0.5, tn.x + Math.sin(t * 4) * s(10), g - h);
      ctx.stroke();
      ctx.fillStyle = "#e9a7c9";
      for (let k = 1; k < 4; k++) circle(tn.x + s(6), g - (h * k) / 4, s(3), LINE);
    }
    ctx.restore();
  }
}

// Pancake Golem: a walking stack of pancakes. It lobs sticky syrup, sprays a fan of it when
// enraged, and every time it loses a third of its HP a pancake slides off and rolls into battle.
const PANCAKE_STACK = 3;

class PancakeMinion extends Soldier {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = settings.soldierSpeed * 1.3;
    this.size = s(30);
    this.groundOffset = s(12);
    this.hp = 4;
    this.fireRate = 0.8;
    this.melee = true;
  }

  move(dt, enemies) {
    const before = this.x;
    super.move(dt, enemies);
    this.rollAngle = (this.rollAngle || 0) + (this.x - before) / s(12);
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rollAngle || 0);
    ctx.fillStyle = "#e0b070";
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.arc(0, 0, s(13), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#a8743a";
    ctx.beginPath();
    ctx.arc(0, 0, s(8), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Angry eyebrows stay upright.
    ctx.save();
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(x - s(4), y - s(3), s(1.8), 0, Math.PI * 2);
    ctx.arc(x + s(4), y - s(3), s(1.8), 0, Math.PI * 2);
    ctx.fill();
    line(x - s(7), y - s(8), x - s(2), y - s(6), c, sw(1.5));
    line(x + s(7), y - s(8), x + s(2), y - s(6), c, sw(1.5));
    ctx.restore();
  }
}

class PancakeGolem extends Boss {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain, maxHp);
    this.name = "PANCAKE GOLEM";
    this.speed = 5;
    this.size = s(140);
    this.groundOffset = s(70);
    this.slowAttack = 2.8;
    this.fastAttack = 1.9;
    this.specialEvery = 6.5;
    this.shed = 0;
  }

  radius() {
    return this.size * 0.5;
  }

  blockingRadius() {
    return this.size * 0.36;
  }

  attack(game, enemies) {
    const ground = enemies.filter((e) => !(e instanceof Airplane));
    const targets = (ground.length ? ground : enemies).slice().sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x)).slice(0, 2);
    targets.forEach((t, i) => game.lobEgg(this.x + this.side * s(30), this.y - s(60), t.x + rand(-25, 25), t.y, this.side, 2, 1.5 + i * 0.25, "sticky"));
    audio.play("slime");
  }

  special(game) {
    // Syrup fan.
    for (let i = 0; i < 6; i++) {
      const tx = this.x + this.side * s(120 + i * 80);
      game.lobEgg(this.x, this.y - s(70), tx, this.terrain.yAt(clamp(tx, 0, W)), this.side, 1, 1.3 + i * 0.12, "sticky");
    }
    if (game.canSpeak(this)) this.say("SYRUP STORM!", 1.3);
  }

  updateBoss(game, dt, enemies) {
    // Shed a pancake at each third of HP lost.
    const shouldShed = Math.min(PANCAKE_STACK - 1, Math.floor((1 - this.hp / this.maxHp) * PANCAKE_STACK));
    while (this.shed < shouldShed) {
      this.shed++;
      const minion = new PancakeMinion(this.x + this.side * s(40), this.side, this.terrain);
      minion.hp = Math.max(2, Math.ceil(minion.hp * Progression.enemyHpScale(game.stage)));
      game.units.push(minion);
      Effects.debris(this.x, this.y - s(40), 6, "#a8743a");
      audio.play("bawk");
      if (game.canSpeak(this)) this.say("Get them, flapjack!", 1.4);
    }
    super.updateBoss(game, dt, enemies);
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const ground = this.terrain.yAt(x);
    const t = performance.now() * 0.004 + this.wobble;
    const step = Math.sin(t);
    const cakes = PANCAKE_STACK - this.shed;
    ctx.save();
    // Stubby legs.
    line(x - s(22), ground - s(28), x - s(26) + step * s(8), ground, c, sw(6));
    line(x + s(22), ground - s(28), x + s(26) - step * s(8), ground, c, sw(6));
    // The stack, bottom to top.
    let top = ground - s(30);
    for (let i = 0; i < cakes; i++) {
      const cy = top - s(16);
      ctx.fillStyle = "#e0b070";
      ctx.strokeStyle = LINE;
      ctx.lineWidth = sw(2.5);
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(t + i) * s(3), cy, s(68 - i * 4), s(18), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#a8743a";
      ctx.lineWidth = sw(1.5);
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(t + i) * s(3), cy - s(4), s(60 - i * 4), s(10), 0, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      top = cy - s(10);
    }
    // Syrup drips and a butter pat on top.
    ctx.fillStyle = "rgba(170,95,30,0.85)";
    ctx.beginPath();
    ctx.ellipse(x, top + s(4), s(46), s(10), 0, 0, Math.PI * 2);
    ctx.fill();
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.ellipse(x + k * s(18), top + s(18) + Math.abs(k) * s(3), s(4), s(10 + (k % 2 ? 4 : 0)), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffe27a";
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(1.5);
    ctx.fillRect(x - s(12), top - s(8), s(24), s(12));
    ctx.strokeRect(x - s(12), top - s(8), s(24), s(12));
    // Face on the top pancake.
    const fy = top + s(10);
    ctx.fillStyle = WHITE;
    for (const ex of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + ex * s(18), fy, s(7), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = this.enraged ? RED : LINE;
    for (const ex of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + ex * s(18) + this.side * s(2), fy + s(1), s(3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Toaster Titan: a giant chrome toaster on stubby legs. It pops two slices of burnt toast at the
// nearest troops; enraged, the lever slams down and a whole volley of toast flies out.
class ToasterTitan extends Boss {
  constructor(x, side, terrain, maxHp) {
    super(x, side, terrain, maxHp);
    this.name = "TOASTER TITAN";
    this.speed = 6;
    this.size = s(140);
    this.groundOffset = s(66);
    this.slowAttack = 2.0;
    this.fastAttack = 1.4;
    this.specialEvery = 6;
    this.pop = 0;
  }

  radius() {
    return this.size * 0.5;
  }

  blockingRadius() {
    return this.size * 0.38;
  }

  attack(game, enemies) {
    const ground = enemies.filter((e) => !(e instanceof Airplane));
    const pool = ground.length ? ground : enemies;
    const targets = pool.slice().sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x)).slice(0, 3);
    const top = this.terrain.yAt(this.x) - s(130);
    targets.forEach((t, i) => game.lobEgg(this.x + (i ? 1 : -1) * s(18), top, t.x + rand(-25, 25), t.y, this.side, 0, 1.6 + i * 0.2, "toast"));
    this.pop = 1;
    audio.play("pop");
  }

  special(game) {
    const top = this.terrain.yAt(this.x) - s(130);
    for (let i = 0; i < 7; i++) {
      const tx = this.x + this.side * s(100 + i * 85);
      game.lobEgg(this.x, top, tx, this.terrain.yAt(clamp(tx, 0, W)), this.side, 0, 1.4 + i * 0.1, "toast");
    }
    this.pop = 1.5;
    audio.play("unlock");
    if (game.canSpeak(this)) this.say("DING! TOAST'S UP!", 1.4);
  }

  updateBoss(game, dt, enemies) {
    this.pop = Math.max(0, this.pop - dt * 2);
    super.updateBoss(game, dt, enemies);
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const ground = this.terrain.yAt(x);
    const t = performance.now() * 0.004 + this.wobble;
    const step = Math.sin(t);
    const w = s(130);
    const h = s(100);
    const top = ground - s(22) - h;
    ctx.save();
    // Stubby legs and a power cord tail.
    line(x - s(35), ground - s(24), x - s(40) + step * s(6), ground, c, sw(6));
    line(x + s(35), ground - s(24), x + s(40) - step * s(6), ground, c, sw(6));
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.moveTo(x - this.side * w * 0.5, ground - s(40));
    ctx.quadraticCurveTo(x - this.side * (w * 0.5 + s(40)), ground - s(10), x - this.side * (w * 0.5 + s(60)), ground - s(4));
    ctx.stroke();
    // Chrome body.
    const grad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    grad.addColorStop(0, "#9aa3ad");
    grad.addColorStop(0.45, "#eef2f6");
    grad.addColorStop(1, "#8a939d");
    ctx.fillStyle = grad;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(3);
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + s(16), top);
    ctx.lineTo(x + w / 2 - s(16), top);
    ctx.quadraticCurveTo(x + w / 2, top, x + w / 2, top + s(16));
    ctx.lineTo(x + w / 2, top + h);
    ctx.lineTo(x - w / 2, top + h);
    ctx.lineTo(x - w / 2, top + s(16));
    ctx.quadraticCurveTo(x - w / 2, top, x - w / 2 + s(16), top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Bread slots with toast poking out.
    for (const sx of [-1, 1]) {
      ctx.fillStyle = "#c98a3a";
      ctx.fillRect(x + sx * s(22) - s(14), top - s(16) * (0.3 + this.pop), s(28), s(18));
      ctx.strokeRect(x + sx * s(22) - s(14), top - s(16) * (0.3 + this.pop), s(28), s(18));
      ctx.fillStyle = LINE;
      ctx.fillRect(x + sx * s(22) - s(16), top - s(2), s(32), s(5));
    }
    // Lever on the side and a dial.
    ctx.fillStyle = RED;
    ctx.fillRect(x + this.side * (w / 2) - s(4), top + s(20) + this.pop * s(30), s(10), s(8));
    ctx.beginPath();
    ctx.arc(x - this.side * s(36), top + h - s(22), s(7), 0, Math.PI * 2);
    ctx.fillStyle = WHITE;
    ctx.fill();
    ctx.stroke();
    // Angry face.
    const fy = top + h * 0.45;
    ctx.fillStyle = LINE;
    for (const ex of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + ex * s(20), fy, s(6), 0, Math.PI * 2);
      ctx.fill();
      line(x + ex * s(10), fy - s(14), x + ex * s(30), fy - s(9), this.enraged ? RED : LINE, sw(3));
    }
    ctx.restore();
  }
}

const BOSS_ROTATION = ["mech", "fortress", "zeppelin", "hen", "kraken", "pancake", "toaster"];
const BOSS_NAMES = {
  mech: "Giant Rooster Mech",
  fortress: "Omelet Fortress",
  zeppelin: "Scrambler Zeppelin",
  hen: "Mother Hen Queen",
  kraken: "Sink Kraken",
  pancake: "Pancake Golem",
  toaster: "Toaster Titan",
};

const Bosses = {
  isBossStage(stage) {
    return stage % BOSS_EVERY === 0;
  },

  // The first boss stages meet each boss once, in order. After that the boss is a seeded
  // random pick that never repeats the previous boss stage's boss.
  kindForStage(stage) {
    const n = Math.floor(stage / BOSS_EVERY) - 1;
    if (n < BOSS_ROTATION.length) return BOSS_ROTATION[Math.max(0, n)];
    const prev = this.kindForStage(stage - BOSS_EVERY);
    const pool = BOSS_ROTATION.filter((k) => k !== prev);
    return pool[Math.floor(seededRandom(stage * 3571 + 11)() * pool.length)];
  },

  // Creates the boss for this stage using its share of the enemy budget.
  spawn(game, budget) {
    const points = budget * BOSS_BUDGET_SHARE;
    const hp = Math.max(10, Math.round(points * BOSS_HP_PER_POINT * Progression.enemyHpScale(game.stage)));
    const kind = this.kindForStage(game.stage);
    const boss = kind === "mech" ? new RoosterMech(W - s(380), LEFT, game.terrain, hp)
      : kind === "fortress" ? new OmeletFortress(W - s(220), LEFT, game.terrain, hp)
        : kind === "hen" ? new HenQueen(W - s(330), LEFT, game.terrain, hp)
          : kind === "kraken" ? new SinkKraken(W * 0.74, LEFT, game.terrain, hp)
            : kind === "pancake" ? new PancakeGolem(W - s(340), LEFT, game.terrain, hp)
              : kind === "toaster" ? new ToasterTitan(W - s(330), LEFT, game.terrain, hp)
            : new ScramblerZeppelin(W * 0.7, LEFT, game.terrain, hp);
    boss.statScaled = true;
    game.units.push(boss);
    game.boss = boss;
    return boss;
  },

  drawBar(game) {
    const boss = game.boss;
    if (!boss || game.scene !== "battle" || game.winner) return;
    const w = 520;
    const x = (W - w) / 2;
    const y = 128;
    const frac = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.save();
    ctx.fillStyle = PAPER;
    ctx.fillRect(x, y, w, 18);
    ctx.fillStyle = boss.enraged ? RED : rgbaFromHex(RED, 0.7);
    ctx.fillRect(x, y, w * frac, 18);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, 18);
    line(x + w / 2, y, x + w / 2, y + 18, LINE, 1);
    ctx.fillStyle = LINE;
    ctx.font = "bold 13px Courier New";
    const label = `BOSS: ${boss.name}${boss.enraged ? "  - ENRAGED!" : ""}`;
    ctx.fillText(label, x + (w - ctx.measureText(label).width) / 2, y + 13);
    ctx.restore();
  },
};

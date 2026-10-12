"use strict";

// Boss battles: every 5th stage the enemy brings a boss that takes 40% of its point budget
// (DESIGN.md section 3), so a boss stage is a different fight, not a harder one.
// Bosses have two phases: below half health they attack faster and add a special move.

const BOSS_EVERY = 5;
const BOSS_BUDGET_SHARE = 0.4;
// Hit points per threat point, matching ordinary units (a 10-point tank has 5 HP).
const BOSS_HP_PER_POINT = 0.5;
// Boss stages get extra time, and the boss counts half its HP in the timeout tiebreak.
const BOSS_EXTRA_SECONDS = 12;
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

const Bosses = {
  isBossStage(stage) {
    return stage % BOSS_EVERY === 0;
  },

  kindForStage(stage) {
    return ["mech", "fortress", "zeppelin"][(Math.floor(stage / BOSS_EVERY) - 1) % 3];
  },

  // Creates the boss for this stage using its share of the enemy budget.
  spawn(game, budget) {
    const points = budget * BOSS_BUDGET_SHARE;
    const hp = Math.max(10, Math.round(points * BOSS_HP_PER_POINT * Progression.enemyHpScale(game.stage)));
    const kind = this.kindForStage(game.stage);
    const boss = kind === "mech" ? new RoosterMech(W - s(380), LEFT, game.terrain, hp)
      : kind === "fortress" ? new OmeletFortress(W - s(220), LEFT, game.terrain, hp)
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

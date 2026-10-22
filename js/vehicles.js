"use strict";

// Phase 2 vehicles (ROADMAP section 10). Each is a normal unit type: it has a shop card, threat
// points and caps in js/config.js, an unlock level in js/unlocks.js and an icon in js/hud.js.
//   CatapultWagon  slow siege cart that hangs back and lobs huge bursting eggs across the field
//   MonsterTruck   armoured bruiser that drives over infantry (they can't block it) and rams the rest
//   ChickBalloon   hot-air balloon that drifts over the enemy and drops chick paratroopers

const CHICK_DROPS = 4;
const CHICK_FALL_SPEED = 70;

function drawWheel(x, y, r, spin, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
  for (let i = 0; i < 2; i++) {
    const a = spin + (i * Math.PI) / 2;
    line(x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r, color, sw(1));
  }
}

class CatapultWagon extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = settings.tankSpeed * 0.35;
    this.size = s(44);
    this.groundOffset = s(18);
    this.hp = 4;
    this.fireRate = 0.06;
    this.eggBurst = 6;
    this.lobTime = [2.6, 3.2];
    this.heavy = true;
    this.arm = 0;
  }

  // Siege engines stay back: they stop rolling once anything is within half the field.
  move(dt, enemies) {
    const near = enemies.some((e) => !(e instanceof Airplane) && Math.abs(e.x - this.x) < W * 0.5);
    if (!near) super.move(dt, enemies);
    this.arm = Math.max(0, this.arm - dt * 2.5);
    this.roll = (this.roll || 0) + (near ? 0 : this.speed * dt * 0.08);
  }

  aim() {
    this.arm = 1;
  }

  muzzle() {
    return [this.x - this.side * s(6), this.y - s(40)];
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    // Cart bed.
    ctx.beginPath();
    ctx.rect(x - s(24), y - s(6), s(48), s(12));
    teamFill(c, 0.35);
    ctx.stroke();
    drawWheel(x - s(15), y + s(8), s(9), this.roll || 0, c);
    drawWheel(x + s(15), y + s(8), s(9), this.roll || 0, c);
    // A-frame and throwing arm: cocked back, then flung forward when it fires.
    line(x - s(10), y - s(6), x, y - s(26), c);
    line(x + s(10), y - s(6), x, y - s(26), c);
    const swing = -this.side * (1 - this.arm) * 0.9 + this.side * this.arm * 0.6;
    const ang = -Math.PI / 2 + swing;
    const ax = x + Math.cos(ang) * s(30);
    const ay = y - s(26) + Math.sin(ang) * s(30);
    line(x - Math.cos(ang) * s(10), y - s(26) - Math.sin(ang) * s(10), ax, ay, LINE, sw(3));
    ctx.beginPath();
    ctx.arc(ax, ay, s(6), 0, Math.PI);
    ctx.stroke();
    if (this.arm < 0.5) {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.ellipse(ax, ay - s(3), s(4), s(5), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = sw(1);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class MonsterTruck extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = settings.tankSpeed * settings.motorcycleSpeedMultiplier * 0.6;
    this.size = s(50);
    this.groundOffset = s(26);
    this.hp = 6;
    this.fireRate = 1.2;
    this.heavy = true;
    this.roll = 0;
  }

  // Infantry can't stop a monster truck: only vehicles, castles and bosses block it.
  move(dt, enemies) {
    const blockers = enemies.filter((e) => !(e instanceof Soldier));
    const before = this.x;
    super.move(dt, blockers);
    this.roll += Math.abs(this.x - before) * 0.12;
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    const bounce = Math.abs(Math.sin(this.roll * 0.7)) * s(2);
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    drawWheel(x - s(17), y + s(13), s(13), this.roll, LINE);
    drawWheel(x + s(17), y + s(13), s(13), this.roll, LINE);
    // Body: a big frying pan on wheels, handle pointing back.
    const by = y - s(4) - bounce;
    ctx.beginPath();
    ctx.ellipse(x, by, s(25), s(9), 0, 0, Math.PI * 2);
    teamFill(c, 0.45);
    ctx.stroke();
    line(x - this.side * s(24), by, x - this.side * s(40), by - s(6), LINE, sw(4));
    // Cab with a driver.
    ctx.beginPath();
    ctx.rect(x - s(6), by - s(17), s(16), s(10));
    teamFill(c, 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s(2), by - s(12), s(3), 0, Math.PI * 2);
    teamFill(c, 0.8);
    ctx.stroke();
    // Fried egg painted on the hood.
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(x + this.side * s(12), by - s(1), s(7), s(4), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = YOLK;
    ctx.beginPath();
    ctx.arc(x + this.side * s(12), by - s(1), s(2.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ChickBalloon extends Airplane {
  constructor(x, side, terrain, lane = 0) {
    super(x, side, terrain, lane);
    this.flightY = H * 0.24 + (lane % 2) * H * 0.05;
    this.speed = settings.airplaneSpeed * 0.45;
    this.size = s(48);
    this.hp = 3;
    this.fireRate = 0.12;
    this.chicksLeft = CHICK_DROPS;
    this.sway = rand(0, 6);
  }

  // Drifts toward the enemy and parks over the middle of their ground army.
  move(dt, enemies) {
    this.sway += dt;
    const ground = enemies.filter((e) => !(e instanceof Airplane));
    const target = ground.length ? ground.reduce((a, b) => (Math.abs(a.x - this.x) < Math.abs(b.x - this.x) ? a : b)).x : W / 2;
    const dx = target - this.x;
    if (Math.abs(dx) > s(30)) this.x += Math.sign(dx) * this.speed * dt;
    this.x = clamp(this.x, -s(80), W + s(80));
  }

  get y() {
    return this.flightY + Math.sin(this.sway * 1.4) * s(5);
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    // Envelope with stripes.
    ctx.beginPath();
    ctx.ellipse(x, y - s(22), s(22), s(26), 0, 0, Math.PI * 2);
    teamFill(c, 0.25);
    ctx.stroke();
    for (const k of [-0.45, 0.45]) {
      ctx.beginPath();
      ctx.ellipse(x, y - s(22), s(22) * Math.abs(k), s(26), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Ropes and basket full of chicks.
    line(x - s(14), y - s(4), x - s(8), y + s(12), LINE, sw(1));
    line(x + s(14), y - s(4), x + s(8), y + s(12), LINE, sw(1));
    ctx.beginPath();
    ctx.rect(x - s(9), y + s(12), s(18), s(10));
    ctx.fillStyle = "#c79a5a";
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();
    for (let i = 0; i < this.chicksLeft; i++) {
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.arc(x - s(6) + i * s(4), y + s(11), s(2.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// A chick paratrooper: a tiny one-hit soldier that floats down under a parachute.
function makeChick(balloon) {
  const chick = new Soldier(balloon.x, balloon.side, balloon.terrain);
  chick.hp = 1;
  chick.size *= 0.75;
  chick.visualScale = 0.75;
  chick.chick = true;
  chick.parachute = true;
  chick.airborne = true;
  chick.lift = Math.max(0, chick.terrain.yAt(balloon.x) - chick.groundOffset - (balloon.y + s(24)));
  return chick;
}

// Rolling-Pin Roller: a slow, heavy roller that shoves the enemy front line back as it advances.
// Light ground units can't stop it: they get pushed along in front of it and bonked now and then.
// Tanks, other vehicles, castles and bosses block it as usual.
class RollingPinRoller extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = settings.tankSpeed * 1.3;
    this.size = s(54);
    this.groundOffset = s(20);
    this.hp = 7;
    this.fireRate = 0.7;
    this.heavy = true;
    this.roll = 0;
  }

  pushable(e) {
    return !(e instanceof Airplane) && !e.heavy && !e.isBoss && !(e instanceof Tank) && !(e instanceof Castle) && !e.airborne;
  }

  move(dt, enemies) {
    const before = this.x;
    super.move(dt, enemies.filter((e) => !this.pushable(e)));
    this.roll += Math.abs(this.x - before) * 0.15;
    // Shove whatever light unit is right in front.
    const front = this.x + this.side * this.blockingRadius();
    for (const e of enemies) {
      if (!this.pushable(e)) continue;
      const gap = (e.x - front) * this.side;
      if (gap < e.blockingRadius() && gap > -this.blockingRadius()) e.x = clamp(front + this.side * e.blockingRadius(), s(45), W - s(45));
    }
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    const d = this.side;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    // The rolling pin itself, with turning grain lines.
    const py = y + s(6);
    ctx.beginPath();
    ctx.ellipse(x + d * s(12), py, s(14), s(14), 0, 0, Math.PI * 2);
    ctx.fillStyle = "#d9a86c";
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const a = this.roll + (k * Math.PI * 2) / 3;
      line(x + d * s(12), py, x + d * s(12) + Math.cos(a) * s(13), py + Math.sin(a) * s(13), "#a8743a", sw(1.2));
    }
    // Handles poking out of the pin.
    line(x + d * s(12), py, x + d * s(12), py - s(18), LINE, sw(3));
    // Cart and driver behind it.
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.rect(x - d * s(22) - s(14), y - s(10), s(28), s(16));
    teamFill(c, 0.35);
    ctx.stroke();
    drawWheel(x - d * s(22) - s(8), y + s(10), s(6), this.roll, c);
    drawWheel(x - d * s(22) + s(8), y + s(10), s(6), this.roll, c);
    line(x - d * s(10), y - s(4), x + d * s(10), py - s(14), c, sw(2));
    ctx.beginPath();
    ctx.arc(x - d * s(20), y - s(18), s(5), 0, Math.PI * 2);
    teamFill(c, 0.8);
    ctx.stroke();
    // Chef's hat on the driver.
    ctx.fillStyle = WHITE;
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.rect(x - d * s(20) - s(4), y - s(27), s(8), s(5));
    ctx.arc(x - d * s(20), y - s(28), s(5), Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// Hover Coop: a chicken coop on an air cushion. Fast and light, it floats over hazards, mud,
// syrup and goo without slowing down, and pecks out quick little eggs at short range.
class HoverCoop extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = settings.tankSpeed * settings.motorcycleSpeedMultiplier * 0.8;
    this.size = s(38);
    this.groundOffset = s(24);
    this.hp = 3;
    this.fireRate = 0.24;
    this.hover = true;
  }

  get y() {
    return this.terrain.yAt(this.x) - this.groundOffset - (this.lift || 0) + Math.sin(performance.now() * 0.006 + this.wobble) * s(2);
  }

  muzzle() {
    return [this.x + this.side * s(14), this.y - s(14)];
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    // Air cushion skirt with little puffs underneath.
    ctx.beginPath();
    ctx.ellipse(x, y + s(12), s(22), s(6), 0, 0, Math.PI * 2);
    ctx.fillStyle = rgbaFromHex(LINE, 0.55);
    ctx.fill();
    ctx.stroke();
    if (Math.random() < 0.3) Effects.spawn("smoke", x + rand(-s(16), s(16)), y + s(18), rand(-20, 20), rand(5, 20), 0.35, 3, LINE);
    // Coop body and roof.
    ctx.beginPath();
    ctx.rect(x - s(16), y - s(8), s(32), s(18));
    teamFill(c, 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - s(20), y - s(8));
    ctx.lineTo(x, y - s(22));
    ctx.lineTo(x + s(20), y - s(8));
    ctx.closePath();
    ctx.fillStyle = RED;
    ctx.fill();
    ctx.stroke();
    // A hen peeking out of the window.
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(x + this.side * s(6), y - s(1), s(5), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = YOLK;
    ctx.beginPath();
    ctx.moveTo(x + this.side * s(10), y - s(2));
    ctx.lineTo(x + this.side * s(15), y);
    ctx.lineTo(x + this.side * s(10), y + s(1));
    ctx.fill();
    ctx.restore();
  }
}

// Pogo Tank: a little tank on a giant spring. Every few seconds it boings over the front line
// and lands among the enemy with a stomp (1 hit to ground units it lands on).
const POGO_HOP_SECONDS = 1;
const POGO_HOP_DISTANCE = 300;

class PogoTank extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = settings.tankSpeed * 2;
    this.size = s(38);
    this.groundOffset = s(30);
    this.hp = 5;
    this.fireRate = 0.12;
    this.eggBurst = 2;
    this.heavy = true;
    this.hopIn = rand(1, 2.5);
    this.hopT = 0;
    this.hopLift = 0;
  }

  get y() {
    return this.terrain.yAt(this.x) - this.groundOffset - (this.lift || 0) - this.hopLift;
  }

  muzzle() {
    return [this.x + this.side * s(24), this.y - s(14)];
  }

  move(dt, enemies) {
    if (this.hopT > 0) {
      this.hopT -= dt;
      const k = 1 - Math.max(0, this.hopT) / POGO_HOP_SECONDS;
      this.hopLift = Math.sin(k * Math.PI) * s(80);
      this.x = clamp(this.x + this.side * (this.hopDist / POGO_HOP_SECONDS) * dt, s(45), W - s(45));
      if (this.hopT <= 0) {
        this.hopLift = 0;
        this.landed = true;
      }
      return;
    }
    super.move(dt, enemies);
    // Aim each hop to land right on the nearest enemy ground unit ahead (up to a max distance).
    const ahead = enemies.filter((e) => !(e instanceof Airplane) && !e.airborne && (e.x - this.x) * this.side > 0);
    const gap = ahead.length ? Math.min(...ahead.map((e) => Math.abs(e.x - this.x))) : Infinity;
    if ((this.hopIn -= dt) <= 0 && gap > s(40) && gap < Infinity) {
      this.hopIn = rand(4, 6);
      this.hopT = POGO_HOP_SECONDS;
      this.hopDist = Math.min(s(POGO_HOP_DISTANCE), gap);
      audio.play("boing");
    }
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    const ground = this.terrain.yAt(x) - (this.lift || 0);
    ctx.save();
    // The spring, stretched when airborne.
    const springTop = y + s(10);
    const coils = 5;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.moveTo(x, springTop);
    for (let i = 1; i <= coils * 2; i++) {
      const k = i / (coils * 2);
      ctx.lineTo(x + (i % 2 ? s(8) : -s(8)), springTop + (ground - springTop) * k);
    }
    ctx.stroke();
    // Little tank body.
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.rect(x - s(18), y - s(4), s(36), s(14));
    teamFill(c, 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - s(4), s(9), Math.PI, 0);
    teamFill(c, 0.2);
    ctx.stroke();
    line(x + this.side * s(6), y - s(8), x + this.side * s(24), y - s(14), c, sw(3));
    ctx.restore();
  }
}

// Pigeon Flock: three scruffy pigeons flying as one unit. They cross the sky like an airplane and
// every so often swoop down on an enemy ground unit ahead (1 hit at the bottom of the dive).
const PIGEON_DIVE_SECONDS = 0.7;

class PigeonFlock extends Airplane {
  constructor(x, side, terrain, lane = 0) {
    super(x, side, terrain, lane);
    this.speed = settings.airplaneSpeed * 0.75;
    this.size = s(46);
    this.hp = 6;
    this.fireRate = 0.3;
    this.dive = 0;
    this.flap = rand(0, 6);
  }

  move(dt) {
    // While diving, swoop straight at the target instead of flying on.
    if (this.dive > 0 && this.diveTarget && !this.diveTarget.dead) this.x += (this.diveTarget.x - this.x) * Math.min(1, dt * 8);
    else super.move(dt);
    this.flap += dt * 14;
    if (this.dive > 0) {
      this.dive = Math.max(0, this.dive - dt);
      if (!this.diveDone && this.dive < PIGEON_DIVE_SECONDS / 2) {
        this.diveDone = true;
        this.diveStrike = true;
      }
    }
  }

  get y() {
    if (!(this.dive > 0) || !this.diveTarget) return this.flightY;
    const k = 1 - this.dive / PIGEON_DIVE_SECONDS;
    const bottom = this.diveTarget.dead ? this.flightY : this.diveTarget.y - this.diveTarget.size * 0.4;
    return this.flightY + Math.sin(k * Math.PI) * (bottom - this.flightY);
  }

  draw() {
    const c = teamColor(this.side);
    const y = this.y;
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const px = this.x - this.side * i * s(16);
      const py = y + (i === 1 ? -s(10) : i === 2 ? s(8) : 0);
      const f = Math.sin(this.flap + i * 1.7);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "#9aa0a8";
      ctx.beginPath();
      ctx.ellipse(px, py, s(9), s(5), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Head with a team-coloured neck ring.
      ctx.beginPath();
      ctx.arc(px + this.side * s(8), py - s(3), s(3.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + this.side * s(6), py - s(1), s(3), 0, Math.PI);
      ctx.stroke();
      // Flapping wing.
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px - this.side * s(2), py - s(2));
      ctx.lineTo(px - this.side * s(8), py - s(2) - f * s(9));
      ctx.lineTo(px + this.side * s(3), py - s(1));
      ctx.stroke();
    }
    ctx.restore();
  }
}

const DINO_DRAW_SCALE = 1.4;

// Dino Rider: a little T-rex with a rider on its back. Tough and fairly quick, it walks up to the
// enemy line and chomps whatever is in front of it for 2 hits.
class DinoRider extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = settings.soldierSpeed * 1.4;
    this.size = s(62);
    this.groundOffset = s(42);
    this.hp = 7;
    this.fireRate = 0.7;
    this.melee = true;
    this.heavy = true;
    this.biteDamage = 2;
    this.chomp = 0;
    this.stride = 0;
  }

  move(dt, enemies) {
    const before = this.x;
    super.move(dt, enemies);
    this.stride += Math.abs(this.x - before) * 0.15;
    this.chomp = Math.max(0, this.chomp - dt * 3);
  }

  draw() {
    const c = teamColor(this.side);
    const x = this.x;
    const y = this.y;
    const d = this.side;
    const step = Math.sin(this.stride);
    ctx.save();
    // Drawn at 1.4x around its centre so it stands taller than the infantry.
    ctx.translate(x, y);
    ctx.scale(DINO_DRAW_SCALE, DINO_DRAW_SCALE);
    ctx.translate(-x, -y);
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    // Legs and tail.
    line(x - d * s(6), y + s(10), x - d * s(10) + step * s(6), y + s(30), c, sw(4));
    line(x + d * s(6), y + s(10), x + d * s(10) - step * s(6), y + s(30), c, sw(4));
    ctx.beginPath();
    ctx.moveTo(x - d * s(14), y);
    ctx.quadraticCurveTo(x - d * s(34), y + s(2), x - d * s(44), y + s(12));
    ctx.quadraticCurveTo(x - d * s(30), y + s(10), x - d * s(12), y + s(10));
    ctx.closePath();
    teamFill(c, 0.35);
    ctx.stroke();
    // Body.
    ctx.beginPath();
    ctx.ellipse(x, y + s(2), s(18), s(13), -d * 0.25, 0, Math.PI * 2);
    teamFill(c, 0.35);
    ctx.stroke();
    // Big head with a snapping jaw.
    const hx = x + d * s(22);
    const hy = y - s(14);
    const open = 0.15 + this.chomp * 0.5;
    ctx.beginPath();
    ctx.moveTo(hx - d * s(6), hy - s(8));
    ctx.lineTo(hx + d * s(16), hy - s(5));
    ctx.lineTo(hx + d * s(16), hy + s(1));
    ctx.lineTo(hx - d * s(6), hy + s(3));
    ctx.closePath();
    teamFill(c, 0.45);
    ctx.stroke();
    ctx.save();
    ctx.translate(hx - d * s(4), hy + s(3));
    ctx.rotate(d * open);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(d * s(18), 0);
    ctx.lineTo(d * s(16), s(5));
    ctx.lineTo(0, s(5));
    ctx.closePath();
    teamFill(c, 0.45);
    ctx.stroke();
    ctx.restore();
    // Teeth, eye and tiny arms.
    ctx.fillStyle = WHITE;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(hx + d * s(4 + k * 4), hy + s(1));
      ctx.lineTo(hx + d * s(6 + k * 4), hy + s(4));
      ctx.lineTo(hx + d * s(8 + k * 4), hy + s(1));
      ctx.fill();
    }
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(hx + d * s(2), hy - s(4), s(1.8), 0, Math.PI * 2);
    ctx.fill();
    line(x + d * s(14), y - s(2), x + d * s(20), y + s(3), c, sw(2));
    // Rider holding the reins.
    line(x - d * s(2), y - s(10), x - d * s(2), y - s(24), c);
    ctx.beginPath();
    ctx.arc(x - d * s(2), y - s(28), s(4), 0, Math.PI * 2);
    teamFill(c, 0.75);
    ctx.stroke();
    line(x - d * s(2), y - s(18), hx, hy - s(4), LINE, sw(1));
    ctx.restore();
  }
}

// Saucer: a little team-coloured flying saucer. Instead of eggs it uses a tractor beam: it hovers
// over a light enemy trooper, lifts it up and lets go, and the fall costs the trooper 1 hit.
const SAUCER_BEAM_SECONDS = 1.4;

class Saucer extends Airplane {
  constructor(x, side, terrain, lane = 0) {
    super(x, side, terrain, lane);
    this.speed = settings.airplaneSpeed * 0.6;
    this.size = s(46);
    this.hp = 5;
    this.fireRate = 0.22;
    this.beam = 0;
    this.blink = rand(0, 6);
  }

  canBeam(e) {
    return !(e instanceof Airplane) && !(e instanceof Castle) && !(e instanceof Tank) && !e.heavy && !e.isBoss && !e.airborne;
  }

  move(dt) {
    this.blink += dt;
    const t = this.beamTarget;
    if (!(this.beam > 0) || !t || t.dead) {
      this.beam = 0;
      super.move(dt);
      return;
    }
    // Hover over the target and reel it in.
    this.x += (t.x - this.x) * Math.min(1, dt * 4);
    this.beam = Math.max(0, this.beam - dt);
    if (t.caughtBy === this) {
      t.x += (this.x - t.x) * Math.min(1, dt * 3);
      const top = Math.max(0, this.terrain.yAt(clamp(t.x, 0, W)) - t.groundOffset - (this.flightY + s(30)));
      t.lift = Math.min(top, (t.lift || 0) + s(150) * dt);
      t.spin = (t.spin || 0) + dt * 3;
      if (this.beam <= 0) {
        // Let go: it tumbles back down (Events.tickUnit lands it for 1 hit).
        t.caughtBy = null;
        Events.release(t, 0);
        t.liftV = 0;
        this.beamTarget = null;
      }
    }
  }

  draw() {
    const c = teamColor(this.side);
    const y = this.y;
    ctx.save();
    if (this.beam > 0 && this.beamTarget && !this.beamTarget.dead) {
      const t = this.beamTarget;
      ctx.fillStyle = "rgba(120,255,140,0.22)";
      ctx.beginPath();
      ctx.moveTo(this.x - s(12), y + s(6));
      ctx.lineTo(this.x + s(12), y + s(6));
      ctx.lineTo(t.x + s(26), t.y + t.size * 0.5);
      ctx.lineTo(t.x - s(26), t.y + t.size * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.translate(this.x, y);
    ctx.scale(0.9, 0.9);
    drawUfo(0, 0, this.blink);
    // Team-coloured rim.
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, s(4), s(40), s(8), 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

"use strict";

class Unit {
  constructor(x, side, terrain) {
    this.x = x;
    this.side = side;
    this.terrain = terrain;
    this.dead = false;
    this.fireClock = rand(0, 1);
    this.fireRate = settings.fireRate;
    this.speechText = "";
    this.speechTimer = 0;
    this.speechCooldown = speechCooldown(3, 8);
    this.wobble = rand(0, Math.PI * 2);
    this.visualScale = 1;
  }

  get y() {
    return this.terrain.yAt(this.x) - this.groundOffset;
  }

  direction() {
    return this.side;
  }

  radius() {
    return this.size * 0.75;
  }

  blockingRadius() {
    return this.size * 0.65;
  }

  ready(dt) {
    this.fireClock -= dt;
    if (this.fireClock > 0) return false;
    this.fireClock = rand(0.45, 1.55) / Math.max(0.03, this.fireRate);
    return true;
  }

  updateSpeech(dt) {
    if (settings.speechBubbleFrequency <= 0) {
      this.speechText = "";
      this.speechTimer = 0;
      return;
    }
    if (this.speechTimer > 0) this.speechTimer = Math.max(0, this.speechTimer - dt);
    this.speechCooldown -= dt;
    if (this.speechCooldown <= 0) {
      if (settings.speechIdleComments.length) this.say(choice(settings.speechIdleComments), rand(1, 1.45));
      this.speechCooldown = speechCooldown(8, 18);
    }
  }

  say(text, duration = 1.2) {
    this.speechText = text;
    this.speechTimer = duration;
  }

  move(dt, enemies) {
    let step = this.speed * dt;
    const ahead = enemies.filter((e) => !(e instanceof Airplane) && (e.x - this.x) * this.side > 0);
    if (ahead.length) {
      const blocker = ahead.reduce((a, b) => Math.abs(a.x - this.x) < Math.abs(b.x - this.x) ? a : b);
      const gap = Math.abs(blocker.x - this.x);
      const stop = this.blockingRadius() + blocker.blockingRadius();
      if (gap <= stop) return;
      step = Math.min(step, gap - stop);
    }
    this.x = clamp(this.x + this.side * step, s(45), W - s(45));
  }

  takeHit() {
    this.hp -= 1;
    this.dead = this.hp <= 0;
  }

  withVisualScale(drawFn) {
    if (this.visualScale === 1) {
      drawFn();
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.visualScale, this.visualScale);
    ctx.translate(-this.x, -this.y);
    drawFn();
    ctx.restore();
  }
}

class Soldier extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = rand(settings.soldierSpeed * 0.5, settings.soldierSpeed);
    this.size = s(22);
    this.groundOffset = s(20);
    this.hp = settings.soldierHp;
    this.fireRate = settings.soldierFireRate;
  }

  muzzle() {
    return [
      this.x + this.side * s(17) * this.visualScale,
      this.y - s(10) * this.visualScale,
    ];
  }

  draw() {
    this.withVisualScale(() => {
    const c = teamColor(this.side);
    const y = this.y;
    const step = Math.sin(performance.now() * 0.009 + this.wobble) * s(4);
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.arc(this.x, y - s(23), s(6), 0, Math.PI * 2);
    ctx.stroke();
    line(this.x, y - s(17), this.x, y + s(4), c);
    line(this.x, y - s(8), this.x + this.side * s(15), y - s(12), c);
    line(this.x + this.side * s(7), y - s(12), this.x + this.side * s(17), y - s(10), c);
    line(this.x, y + s(4), this.x - s(7), y + s(18) + step, c);
    line(this.x, y + s(4), this.x + s(8), y + s(18) - step, c);
    });
  }
}

class Castle extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.size = s(80);
    this.width = s(58);
    this.height = s(116);
    this.hp = settings.castleHp;
    this.bombBurst = settings.castleBurst;
    this.speed = 0;
    this.fireRate = settings.castleFireRate;
    this.catapultAngle = side === RIGHT ? -Math.PI / 7 : Math.PI + Math.PI / 7;
  }

  get y() {
    return this.terrain.yAt(this.x) - this.height * 0.5;
  }

  radius() {
    return this.size * 0.9;
  }

  blockingRadius() {
    return this.width * 0.55;
  }

  move() {}

  catapultBase() {
    return [this.x - this.side * s(6), this.terrain.yAt(this.x) - this.height - s(4)];
  }

  muzzle() {
    const [baseX, baseY] = this.catapultBase();
    return [
      baseX + Math.cos(this.catapultAngle) * s(44),
      baseY + Math.sin(this.catapultAngle) * s(44),
    ];
  }

  aim(vx, vy) {
    this.catapultAngle = Math.atan2(vy, vx);
  }

  draw() {
    const c = teamColor(this.side);
    const left = this.x - this.width * 0.5;
    const right = this.x + this.width * 0.5;
    const surfaceY = this.terrain.yAt(this.x);
    const top = surfaceY - this.height;
    const leftGround = this.terrain.yAt(left);
    const rightGround = this.terrain.yAt(right);
    const tooth = s(10);
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(3);
    ctx.beginPath();
    [
      [left, top + tooth],
      [left, top],
      [left + tooth, top],
      [left + tooth, top + tooth],
      [left + tooth * 2, top + tooth],
      [left + tooth * 2, top],
      [left + tooth * 3, top],
      [left + tooth * 3, top + tooth],
      [right - tooth * 2, top + tooth],
      [right - tooth * 2, top],
      [right - tooth, top],
      [right - tooth, top + tooth],
      [right, top + tooth],
    ].forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
    ctx.stroke();
    line(left, top + tooth, left, leftGround, c, sw(3));
    line(right, top + tooth, right, rightGround, c, sw(3));
    circle(this.x - s(13), top + s(45), s(4), c);
    circle(this.x + s(13), top + s(45), s(4), c);
    ctx.beginPath();
    ctx.arc(this.x, surfaceY - s(17), s(9), Math.PI, Math.PI * 2);
    ctx.stroke();
    line(this.x - s(9), surfaceY - s(17), this.x - s(9), surfaceY, c);
    line(this.x + s(9), surfaceY - s(17), this.x + s(9), surfaceY, c);

    const [baseX, baseY] = this.catapultBase();
    const [tipX, tipY] = this.muzzle();
    line(baseX, baseY, tipX, tipY, c, sw(3));
    line(baseX - this.side * s(12), baseY + s(15), baseX, baseY, c);
    circle(baseX, baseY + s(16), s(9), c);
    circle(tipX, tipY, s(5), c);

    for (let mark = 0; mark < this.hp; mark++) {
      const row = Math.floor(mark / 5);
      const col = mark % 5;
      const y = Math.min(surfaceY - s(4), top + s(70) + row * s(10));
      line(left + s(9) + col * s(9), y, left + s(14) + col * s(9), y, c);
    }
  }
}

class Tank extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = rand(settings.tankSpeed * 0.5, settings.tankSpeed);
    this.size = s(46);
    this.groundOffset = s(18);
    this.hp = settings.tankHp;
    this.fireRate = settings.tankFireRate;
    this.barrelAngle = side === RIGHT ? -Math.PI / 10 : Math.PI + Math.PI / 10;
    this.wheelOffsets = [-s(24), 0, s(24)];
    this.wheelRadius = s(10);
    this.maxWheelSpan = s(72);
    this.visualWheelYs = this.targetWheelYs();
    this.visualAngle = this.targetBodyAngle();
    this.visualCenterY = this.targetCenterY();
  }

  get y() {
    return this.visualCenterY;
  }

  move(dt, enemies) {
    super.move(dt, enemies);
    this.updateVisualPose(dt);
  }

  targetWheelY(offset) {
    return this.terrain.yAt(this.x + offset) - this.wheelRadius;
  }

  targetWheelYs() {
    const wheelYs = this.wheelOffsets.map((offset) => this.targetWheelY(offset));
    const xSpan = this.wheelOffsets[this.wheelOffsets.length - 1] - this.wheelOffsets[0];
    const maxYSpan = Math.sqrt(Math.max(0, this.maxWheelSpan * this.maxWheelSpan - xSpan * xSpan));
    const minY = Math.min(...wheelYs);
    const maxY = Math.max(...wheelYs);
    const currentSpan = maxY - minY;
    if (currentSpan <= maxYSpan || currentSpan === 0) return wheelYs;

    const centerY = wheelYs.reduce((sum, y) => sum + y, 0) / wheelYs.length;
    const scale = maxYSpan / currentSpan;
    return wheelYs.map((y) => centerY + (y - centerY) * scale);
  }

  targetBodyAngle() {
    const wheelYs = this.targetWheelYs();
    const leftY = wheelYs[0];
    const rightY = wheelYs[wheelYs.length - 1];
    return Math.atan2(rightY - leftY, this.wheelOffsets[this.wheelOffsets.length - 1] - this.wheelOffsets[0]);
  }

  targetCenterY() {
    return this.visualWheelYs.reduce((sum, y) => sum + y, 0) / this.visualWheelYs.length - s(17) * this.visualScale;
  }

  updateVisualPose(dt) {
    const smoothing = Math.min(1, dt * 8);
    const targetYs = this.targetWheelYs();
    this.visualWheelYs = this.visualWheelYs.map((y, index) => y + (targetYs[index] - y) * smoothing);
    const targetAngle = this.targetBodyAngle();
    this.visualAngle += (targetAngle - this.visualAngle) * smoothing;
    const targetY = this.targetCenterY();
    this.visualCenterY += (targetY - this.visualCenterY) * smoothing;
  }

  bodyPoint(localX, localY) {
    localX *= this.visualScale;
    localY *= this.visualScale;
    const cos = Math.cos(this.visualAngle);
    const sin = Math.sin(this.visualAngle);
    return [
      this.x + localX * cos - localY * sin,
      this.visualCenterY + localX * sin + localY * cos,
    ];
  }

  bodyPath(points) {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      const [px, py] = this.bodyPoint(x, y);
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
  }

  barrelStart() {
    return this.bodyPoint(this.side * s(12), -s(18));
  }

  muzzle() {
    const [startX, startY] = this.barrelStart();
    return [
      startX + Math.cos(this.barrelAngle) * s(36) * this.visualScale,
      startY + Math.sin(this.barrelAngle) * s(36) * this.visualScale,
    ];
  }

  aim(vx, vy) {
    this.barrelAngle = Math.atan2(vy, vx);
  }

  draw() {
    const c = teamColor(this.side);
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(3);
    this.bodyPath([
      [-s(36), -s(12)],
      [s(34), -s(12)],
      [s(38), s(4)],
      [s(28), s(12)],
      [-s(34), s(12)],
      [-s(38), s(2)],
    ]);
    ctx.stroke();

    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 1;
    this.bodyPath([
      [-s(28), -s(6)],
      [s(26), -s(6)],
      [s(29), s(5)],
      [-s(27), s(5)],
    ]);
    ctx.stroke();

    ctx.strokeStyle = c;
    ctx.lineWidth = sw(3);
    let turret = [
      [-s(18), -s(16)],
      [s(12), -s(24)],
      [s(28), -s(12)],
      [-s(8), -s(8)],
    ];
    if (this.side === LEFT) turret = turret.map(([x, y]) => [-x, y]);
    this.bodyPath(turret);
    ctx.stroke();

    const [mx, my] = this.muzzle();
    const [barrelX, barrelY] = this.barrelStart();
    line(barrelX, barrelY, mx, my, c, sw(5));
    circle(mx, my, s(5), PAPER);

    this.wheelOffsets.forEach((off, index) => {
      const wx = this.x + off;
      const wy = this.visualWheelYs[index];
      circle(wx, wy, this.wheelRadius, c);
      circle(wx, wy, s(3), c);
    });

    for (let mark = 0; mark < this.hp; mark++) {
      const [x1, y1] = this.bodyPoint(-s(22) + mark * s(12), s(34));
      const [x2, y2] = this.bodyPoint(-s(14) + mark * s(12), s(34));
      line(x1, y1, x2, y2, c, sw(2));
    }
  }
}

class Motorcycle extends Unit {
  constructor(x, side, terrain) {
    super(x, side, terrain);
    this.speed = rand(settings.tankSpeed * settings.motorcycleSpeedMultiplier * 0.5, settings.tankSpeed * settings.motorcycleSpeedMultiplier);
    this.size = s(34);
    this.groundOffset = s(26);
    this.hp = settings.motorcycleHp;
    this.fireRate = settings.motorcycleFireRate;
    this.gunAngle = side === RIGHT ? -Math.PI / 12 : Math.PI + Math.PI / 12;
  }

  muzzle() {
    return [this.x + this.side * s(24), this.y - s(15)];
  }

  aim(vx, vy) {
    this.gunAngle = Math.atan2(vy, vx);
  }

  draw() {
    const c = teamColor(this.side);
    const y = this.y;
    circle(this.x - s(16), this.terrain.yAt(this.x - s(16)) - s(7), s(7), c);
    circle(this.x + s(16), this.terrain.yAt(this.x + s(16)) - s(7), s(7), c);
    line(this.x - s(16), y, this.x, y - s(16), c);
    line(this.x, y - s(16), this.x + s(16), y, c);
    line(this.x, y - s(28), this.x, y - s(10), c);
    circle(this.x, y - s(34), s(5), c);
    line(this.x, y - s(22), ...this.muzzle(), c);
  }
}

class Airplane extends Unit {
  constructor(x, side, terrain, lane = 0) {
    super(x, side, terrain);
    this.flightY = H * 0.1 + (lane % 4) * (H * 0.2 / 3) + rand(-s(6), s(6));
    this.speed = settings.airplaneSpeed;
    this.size = s(52);
    this.hp = settings.airplaneHp;
    this.fireRate = settings.airplaneFireRate;
    this.loopMargin = s(70);
    this.bombBurst = settings.airplaneBurst;
    this.bombSpeed = settings.airplaneBombSpeed;
  }

  get y() {
    return this.flightY;
  }

  move(dt) {
    this.x += this.side * this.speed * dt;
    if (this.side === RIGHT && this.x > W + this.loopMargin) this.x = -this.loopMargin;
    if (this.side === LEFT && this.x < -this.loopMargin) this.x = W + this.loopMargin;
  }

  bombBay() {
    return [this.x - this.side * s(6), this.y + s(9)];
  }

  muzzle() {
    return [this.x + this.side * s(32), this.y];
  }

  draw() {
    drawPlaneShape(this.x, this.y, this.side, teamColor(this.side), 1);
  }
}

class Bomber extends Airplane {
  constructor(x, side, terrain, lane = 0) {
    super(x, side, terrain, lane);
    this.speed = settings.bomberSpeed;
    this.size = s(104);
    this.hp = settings.bomberHp;
    this.fireRate = settings.bomberFireRate;
    this.loopMargin = s(130);
    this.bombBurst = settings.bomberBurst;
    this.bombSpeed = settings.bomberBombSpeed;
  }

  bombBay() {
    return [
      this.x - this.side * s(2) * this.visualScale,
      this.y + s(13) * this.visualScale,
    ];
  }

  muzzle() {
    return [
      this.x + this.side * s(64) * this.visualScale,
      this.y + s(1) * this.visualScale,
    ];
  }

  draw() {
    this.withVisualScale(() => {
      drawPlaneShape(this.x, this.y, this.side, teamColor(this.side), 2);
      line(this.x - this.side * s(34), this.y + s(8), this.x + this.side * s(34), this.y + s(7), teamColor(this.side));
    });
  }
}

class Helicopter extends Airplane {
  constructor(x, side, terrain, lane = 0) {
    super(x, side, terrain, lane);
    this.speed = settings.helicopterSpeed;
    this.size = s(58);
    this.hp = settings.helicopterHp;
    this.fireRate = settings.helicopterFireRate;
    this.loopMargin = s(85);
    this.bombBurst = settings.helicopterBurst;
    this.bombSpeed = settings.helicopterBombSpeed;
    this.hoverDistance = s(settings.helicopterHoverDistance);
    this.facing = side;
  }

  direction() {
    return this.facing;
  }

  move(dt, enemies) {
    const ground = enemies.filter((e) => e instanceof Castle || e instanceof Tank || e instanceof Motorcycle || e instanceof Soldier);
    if (ground.length) {
      const target = ground.reduce((a, b) => Math.abs(a.x - this.x) < Math.abs(b.x - this.x) ? a : b);
      const delta = target.x - this.x;
      if (Math.abs(delta) > this.hoverDistance) {
        const step = Math.min(Math.abs(delta) - this.hoverDistance, this.speed * dt);
        this.x += Math.sign(delta) * step;
        this.facing = delta > 0 ? RIGHT : LEFT;
      }
      return;
    }

    this.x += this.facing * this.speed * dt;
    if (this.x > W - this.loopMargin) {
      this.x = W - this.loopMargin;
      this.facing = LEFT;
    }
    if (this.x < this.loopMargin) {
      this.x = this.loopMargin;
      this.facing = RIGHT;
    }
  }

  bombBay() {
    return [this.x, this.y + s(16)];
  }

  muzzle() {
    return [this.x + this.facing * s(34), this.y + s(2)];
  }

  draw() {
    drawHelicopterShape(this.x, this.y, this.facing, teamColor(this.side));
  }
}

class Drone extends Airplane {
  constructor(x, side, terrain, lane = 0) {
    super(x, side, terrain, lane);
    this.speed = settings.droneSpeed;
    this.size = s(30);
    this.hp = settings.droneHp;
    this.fireRate = 0;
    this.bombBurst = settings.droneBurst;
    this.targetAltitude = H * settings.droneAltitudeRatio + rand(-s(8), s(8));
    this.flightY = this.terrain.yAt(this.x) - s(10);
    this.loopMargin = s(50);
    this.state = "launch";
    this.target = null;
    this.hoverTimer = 0;
    this.impactTarget = null;
  }

  move(dt, enemies) {
    this.impactTarget = null;
    const ground = enemies.filter((e) => e instanceof Castle || e instanceof Tank || e instanceof Motorcycle || e instanceof Soldier);
    if (this.target && (this.target.dead || !ground.includes(this.target))) {
      this.target = null;
      this.state = "patrol";
    }

    if (this.state === "launch") {
      const step = this.speed * dt / Math.sqrt(2);
      this.x += this.side * step;
      this.flightY -= step;
      if (this.flightY <= this.targetAltitude) {
        this.flightY = this.targetAltitude;
        this.state = "patrol";
      }
      return;
    }

    if (this.state === "patrol") {
      if (ground.length) {
        this.target = ground.reduce((a, b) => Math.abs(a.x - this.x) < Math.abs(b.x - this.x) ? a : b);
        this.state = "hover";
      } else {
        this.x += this.side * this.speed * dt;
      }
      return;
    }

    if (this.state === "hover") {
      if (!this.target) {
        this.state = "patrol";
        return;
      }
      const dx = this.target.x - this.x;
      if (Math.abs(dx) > s(8)) this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * dt);
      this.flightY += (this.targetAltitude - this.flightY) * Math.min(1, dt * 6);
      if (Math.abs(dx) <= s(10)) {
        this.hoverTimer += dt;
        if (this.hoverTimer >= 0.35) this.state = "dive";
      } else {
        this.hoverTimer = 0;
      }
      return;
    }

    if (this.state === "dive") {
      if (!this.target) {
        this.state = "patrol";
        return;
      }
      const targetY = this.target.y - this.target.radius() * 0.35;
      const dx = this.target.x - this.x;
      const dy = targetY - this.flightY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const step = this.speed * settings.droneDiveSpeedMultiplier * dt;
      if (step >= distance || distance <= this.radius() + this.target.radius() * 0.35) {
        this.x = this.target.x;
        this.flightY = targetY;
        this.impactTarget = this.target;
        return;
      }
      this.x += dx / distance * step;
      this.flightY += dy / distance * step;
    }
  }

  draw() {
    const c = teamColor(this.side);
    const y = this.y;
    const wobble = Math.sin(performance.now() * 0.02 + this.wobble) * s(2);
    ctx.strokeStyle = c;
    ctx.lineWidth = sw(2);
    ctx.beginPath();
    ctx.ellipse(this.x, y, s(12), s(9), 0, 0, Math.PI * 2);
    ctx.stroke();
    circle(this.x + this.side * s(4), y - s(1), s(2), c);
    const hubY = y - s(15) + wobble;
    line(this.x - s(13), hubY - s(13), this.x + s(13), hubY + s(13), c);
    line(this.x - s(13), hubY + s(13), this.x + s(13), hubY - s(13), c);
    line(this.x, y - s(9), this.x, hubY, c);
  }
}

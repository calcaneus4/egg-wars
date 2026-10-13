"use strict";

class Game {
  constructor() {
    this.terrain = new Terrain();
    this.background = new Background();
    this.units = [];
    this.eggs = [];
    this.splats = [];
    this.wreckage = [];
    this.buttons = [];
    this.score = { blue: 0, red: 0 };
    this.gold = 0;
    this.points = 0;
    this.stage = 1;
    this.unlockedNames = [];
    this.scene = "title";
    this.loadProfile();
    this.newUnlocks = [];
    this.roundTime = 0;
    this.roundLimit = this.nextRoundLimit();
    this.powerUpCooldown = 0;
    this.resultMode = "battle";
    this.lastGoldReward = 0;
    this.lastGoldBonus = 0;
    this.noticeBubble = null;
    this.selectedGameplayHint = "";
    this.titleTimer = 2;
    this.winner = null;
    this.endGameTitle = "";
    this.clouds = [
      { x: 305, y: 164, scale: 1, speed: 8 },
      { x: 780, y: 156, scale: 0.86, speed: 5.5 },
      { x: 1030, y: 214, scale: 0.72, speed: 6.8 },
    ];
    this.startStage();
  }

  loadProfile() {
    const data = SaveManager.load();
    applyPlayerSettings();
    this.gold = data.profile.gold;
    this.stage = data.profile.stage;
    this.unlockedNames = [...data.profile.unlockedNames];
    this.score = { blue: data.stats.wins, red: data.stats.losses };
    this.profile = data.profile;
    this.newUnlocks = [];
  }

  saveProfile() {
    const data = SaveManager.data;
    data.profile.gold = this.gold;
    data.profile.stage = this.practice ? this.frontier : this.stage;
    data.profile.unlockedNames = [...this.unlockedNames];
    data.stats.wins = this.score.blue;
    data.stats.losses = this.score.red;
    SaveManager.save();
  }

  newGame() {
    const prefs = SaveManager.data.settings;
    SaveManager.reset();
    SaveManager.data.settings = prefs;
    SaveManager.save();
    this.loadProfile();
    this.titleTimer = 0;
    this.startStage();
  }

  startBattle() {
    this.endPractice();
    this.scene = "battle";
    this.titleTimer = 0;
    this.startStage();
  }

  // Replays an already-cleared stage for half rewards without moving progress.
  startPractice(stage) {
    this.endPractice();
    this.practice = true;
    this.frontier = this.stage;
    this.stage = stage;
    this.scene = "battle";
    this.titleTimer = 0;
    this.startStage();
  }

  endPractice() {
    if (!this.practice) return;
    this.practice = false;
    this.stage = this.frontier;
  }

  togglePause() {
    if (this.scene === "battle") this.scene = "paused";
    else if (this.scene === "paused") this.scene = "battle";
    else if (this.scene === "settings") this.scene = Menus.returnScene;
    else if (this.scene === "armory") this.scene = Menus.armoryReturn;
    else if (this.scene === "powers") this.scene = Menus.powersReturn;
    else if (["achievements", "map", "stats"].includes(this.scene)) this.scene = "title";
  }

  nextRoundLimit() {
    return Progression.roundSeconds(this.stage);
  }

  startStage() {
    this.biome = Biomes.forStage(this.stage);
    this.terrain.regenerate(this.biome);
    this.background.regenerate(this.biome);
    Sky.regenerate(this.stage);
    Weather.regenerate(this.stage, this.biome);
    Hazards.generate(this.biome, this.terrain);
    this.units = [];
    this.eggs = [];
    this.splats = [];
    this.wreckage = [];
    this.winner = null;
    this.endGameTitle = "";
    this.resultMode = "battle";
    this.roundTime = 0;
    this.roundLimit = this.nextRoundLimit();
    this.powerUpCooldown = 0;
    this.noticeBubble = null;
    this.selectedGameplayHint = "";
    this.roundKills = 0;
    this.roundRewards = null;
    Effects.clear();
    Abilities.reset(this);
    this.rally = Progression.rallyLevel(this.profile.lossStreak);
    this.rallyTimer = this.rally ? 4 : 0;
    this.spawn();
    this.applyRally();
    if (this.bossStage) this.roundLimit += BOSS_EXTRA_SECONDS;
    Reinforcements.plan(this);
    Kit.build(this);
    Objectives.start(this);
    const flags = SaveManager.data.flags;
    flags.biomes = Array.isArray(flags.biomes) ? flags.biomes : [];
    if (this.scene === "battle" && !flags.biomes.includes(this.biome.id)) flags.biomes.push(this.biome.id);
    if (this.scene === "battle") Tutorial.onStageStart(this);
    Events.reset();
    EggTypes.reset();
    Director.planStage(this);
    if (this.scene === "battle") Director.noteStart(this);
    audio.play("start_reveille");
  }

  spawn() {
    this.units = [];
    this.spawnPlayerArmy();
    this.spawnEnemyArmy();
    this.addUnlockedPlayerUnits();
    this.living(RIGHT).forEach((u) => Armory.upgradeUnit(this.profile, u));
    this.scaleEnemiesForStage();
    Personalities.apply(this.personality, this.living(LEFT));
    this.personalityTimer = this.personality.id === "balanced" && !this.bossStage ? 0 : 4.5;
    const blue = this.living(RIGHT);
    const red = this.living(LEFT);
    if (!blue.length || !red.length) this.finishRound(blue.length > 0, red.length === 0);
  }

  addUnlockedPlayerUnits() {
    if (Unlocks.specialUnlocked(this.profile, "Mega Knight")) {
      const knight = new Tank(s(315), RIGHT, this.terrain);
      knight.hp += 6;
      knight.fireRate *= 1.6;
      knight.label = "Mega Knight";
      knight.labelTimer = settings.specialUnitLabelSeconds;
      this.scaleSpecialUnit(knight);
      this.units.push(knight);
    }
    if (Unlocks.specialUnlocked(this.profile, "Fire Wizard")) {
      const wizard = new Soldier(s(185), RIGHT, this.terrain);
      wizard.hp = 3;
      wizard.fireRate = 0.42;
      wizard.label = "Fire Wizard";
      wizard.labelTimer = settings.specialUnitLabelSeconds;
      this.scaleSpecialUnit(wizard);
      this.units.push(wizard);
    }
    if (Unlocks.specialUnlocked(this.profile, "Yolk Bomber")) {
      const bomber = new Bomber(-s(240), RIGHT, this.terrain, 3);
      bomber.hp += 2;
      bomber.bombBurst += 6;
      bomber.label = "Yolk Bomber";
      bomber.labelTimer = settings.specialUnitLabelSeconds;
      this.scaleSpecialUnit(bomber);
      this.units.push(bomber);
    }
  }

  scaleSpecialUnit(unit) {
    const scale = settings.specialUnitVisualScale;
    unit.visualScale = scale;
    unit.size *= scale;
    if (unit.wheelOffsets) {
      unit.wheelOffsets = unit.wheelOffsets.map((offset) => offset * scale);
      unit.wheelRadius *= scale;
      unit.maxWheelSpan *= scale;
      unit.visualWheelYs = unit.targetWheelYs();
      unit.visualAngle = unit.targetBodyAngle();
      unit.visualCenterY = unit.targetCenterY();
    }
  }

  enemyCaps() {
    return {
      tank: settings.maxRightTanks,
      motorcycle: settings.maxRightMotorcycles,
      airplane: settings.maxRightAirplanes,
      bomber: settings.maxRightBombers,
      helicopter: settings.maxRightHelicopters,
      drone: settings.maxRightDrones,
      castle: settings.maxRightCastles,
      soldier: settings.maxRightSoldiers,
      medic: settings.maxRightMedics,
      mortar: settings.maxRightMortars,
      rider: settings.maxRightRiders,
      catapult: settings.maxRightCatapults,
      truck: settings.maxRightTrucks,
      balloon: settings.maxRightBalloons,
    };
  }

  // Comeback assist (DESIGN.md section 9). Only active after 2+ losses in a row.
  applyRally() {
    if (!this.rally) return;
    const p = this.profile;
    // Bonus gold is paid once per loss streak value, so restarting a stage can't farm it.
    if (p.rallyGoldStreak !== p.lossStreak) {
      p.rallyGoldStreak = p.lossStreak;
      this.rallyGold = Progression.rallyBonusGold(this.rally);
      this.gold += this.rallyGold;
      this.saveProfile();
    } else {
      this.rallyGold = 0;
    }
    this.addUnit(RIGHT, "tank");
    if (this.rally >= 2) this.living(RIGHT).forEach((u) => { u.shield = 1; });
  }

  playerCaps() {
    return {
      tank: settings.maxLeftTanks,
      motorcycle: settings.maxLeftMotorcycles,
      airplane: settings.maxLeftAirplanes,
      bomber: settings.maxLeftBombers,
      helicopter: settings.maxLeftHelicopters,
      drone: settings.maxLeftDrones,
      castle: settings.maxLeftCastles,
      soldier: settings.maxLeftSoldiers,
      medic: settings.maxLeftMedics,
      mortar: settings.maxLeftMortars,
      rider: settings.maxLeftRiders,
      catapult: settings.maxLeftCatapults,
      truck: settings.maxLeftTrucks,
      balloon: settings.maxLeftBalloons,
    };
  }

  // The player's free army: a fixed budget of unlocked unit types (power grows via the Armory).
  spawnPlayerArmy() {
    const weights = {};
    for (const [type, weight] of Object.entries(PERSONALITIES.balanced.weights)) {
      if (Unlocks.unitUnlocked(this.profile, type)) weights[type] = weight;
    }
    const counts = Progression.buildArmy(settings.playerArmyBudget, weights, this.playerCaps());
    for (const [type, count] of Object.entries(counts)) this.addMany(RIGHT, type, count);
  }

  spawnEnemyArmy() {
    this.boss = null;
    this.bossStage = Bosses.isBossStage(this.stage);
    this.personality = this.bossStage ? PERSONALITIES.balanced : Personalities.forStage(this.stage);
    let budget = Progression.enemyBudget(this.stage) * Progression.rallyBudgetScale(this.rally || 0) * this.personality.budgetScale;
    if (this.bossStage) {
      Bosses.spawn(this, budget);
      budget *= 1 - BOSS_BUDGET_SHARE;
    }
    const weights = Personalities.weightsFor(this.personality, this.stage);
    const counts = Progression.buildArmy(budget, weights, this.enemyCaps());
    for (const [type, count] of Object.entries(counts)) this.addMany(LEFT, type, count);
  }

  scaleEnemiesForStage() {
    const hpScale = Progression.enemyHpScale(this.stage);
    const fireScale = Progression.enemyFireScale(this.stage);
    this.units.forEach((u) => {
      if (u.side !== LEFT || u.statScaled) return;
      u.hp = Math.max(1, Math.ceil(u.hp * hpScale));
      u.fireRate *= fireScale;
    });
  }

  armyScore(units) {
    // A boss counts half its HP so a wounded boss doesn't win every timeout on its own.
    return units.reduce((sum, u) => sum + Math.max(0, u.hp) * (u.isBoss ? BOSS_SCORE_WEIGHT : 1) + (u instanceof Airplane && !u.isBoss ? 4 : 0) + (u instanceof Castle ? 5 : 0), 0);
  }

  finishRound(blueWon, fullDestruction = false) {
    if (this.winner) return;
    this.resultMode = blueWon ? "won" : "lost";
    this.winner = blueWon ? "BLUE TEAM WINS" : "RED TEAM WINS";
    this.endGameTitle = settings.endGameTitles.length ? choice(settings.endGameTitles) : "";
    this.selectedGameplayHint = settings.gameplayHints.length ? choice(settings.gameplayHints) : "";
    this.lastGoldReward = 0;
    this.lastGoldBonus = 0;
    if (blueWon) {
      let reward = settings.goldWinBase + this.stage * settings.goldPerStage;
      if (fullDestruction) {
        this.lastGoldBonus = settings.fullDestructionGoldBonus;
        reward += this.lastGoldBonus;
        const s = SaveManager.data.stats;
        if (!this.practice && (!s.bestWipeoutTime || this.roundTime < s.bestWipeoutTime)) s.bestWipeoutTime = Math.round(this.roundTime * 10) / 10;
      }
      const bonus = settings.scoreWinBase * this.stage + Math.round(Math.sqrt(this.armyScore(this.living(RIGHT))) * settings.survivorGoldFactor);
      reward += bonus;
      if (this.bossStage) reward += 40;
      reward = Math.round(reward * Armory.goldScale(this.profile) * (this.practice ? PRACTICE_REWARD_SCALE : 1));
      this.gold += reward;
      this.lastGoldReward = reward;
      if (settings.showScore) this.points += bonus;
      this.score.blue++;
      if (!this.practice) this.stage++;
    } else {
      const consolation = Math.round((settings.goldLossBase + settings.goldLossPerStage * this.stage) * Armory.goldScale(this.profile) * (this.practice ? PRACTICE_REWARD_SCALE : 1));
      this.gold += consolation;
      this.lastGoldReward = consolation;
      this.score.red++;
    }
    this.grantProgress(blueWon);
    Stats.add("goldEarned", this.lastGoldReward);
    Stats.add("goldenEggsEarned", this.roundRewards.goldenEggs);
    Results.start(this);
    SaveManager.data.stats.roundsPlayed++;
    this.saveProfile();
    Achievements.check(this);
    audio.play(blueWon ? "end_jingle" : "sad_jingle");
  }

  // XP and Golden Eggs for the round just finished (DESIGN.md sections 6-7).
  grantProgress(blueWon) {
    const p = this.profile;
    const streakBefore = p.lossStreak;
    const playedStage = blueWon && !this.practice ? this.stage - 1 : this.stage;
    if (!this.practice) p.lossStreak = blueWon ? 0 : p.lossStreak + 1;
    const xp = Math.round((Progression.roundXp(playedStage, blueWon) + this.roundKills) * (this.practice ? PRACTICE_REWARD_SCALE : 1));
    const levelBefore = p.level;
    const levelsGained = Progression.addXp(p, xp);
    let goldenEggs = blueWon ? Progression.winGoldenEggs(playedStage) : Progression.lossGoldenEggs(p.lossStreak);
    if (blueWon && this.bossStage) goldenEggs += 3;
    let objectiveEggs = Objectives.finish(this, blueWon);
    if (this.practice) {
      // Practice pays half gold and XP but no Golden Eggs (level-ups still pay theirs).
      goldenEggs = 0;
      objectiveEggs = 0;
    }
    goldenEggs += objectiveEggs;
    const stats = SaveManager.data.stats;
    stats.goalsCompleted += (this.objectives || []).filter((o) => o.complete).length;
    if (blueWon) {
      if (this.bossStage) {
        stats.bossesBeaten++;
        const flags = SaveManager.data.flags;
        flags.bossKinds = Array.isArray(flags.bossKinds) ? flags.bossKinds : [];
        const kind = Bosses.kindForStage(this.stage);
        if (!flags.bossKinds.includes(kind)) flags.bossKinds.push(kind);
      }
      if (streakBefore >= 2) stats.comebacks++;
      if (!stats.bestWinTime || this.roundTime < stats.bestWinTime) stats.bestWinTime = Math.round(this.roundTime * 10) / 10;
      if (this.track && !this.track.unitLost) stats.flawlessWins++;
      if (Sky.phase === "night") stats.nightWins++;
    }
    goldenEggs += levelsGained * Progression.goldenEggsPerLevel;
    p.goldenEggs += goldenEggs;
    SaveManager.data.stats.kills += this.roundKills;
    this.roundRewards = { xp, kills: this.roundKills, goldenEggs, objectiveEggs, levelBefore, levelsGained };
    this.newUnlocks = levelsGained ? Unlocks.between(p, levelBefore, p.level) : [];
  }

  addMany(side, type, count) {
    for (let i = 0; i < count; i++) this.addUnit(side, type);
  }

  addUnit(side, type) {
    const before = this.units.length;
    this.placeUnit(side, type);
    const unit = this.units.length > before ? this.units[this.units.length - 1] : null;
    if (unit && side === RIGHT) Armory.upgradeUnit(this.profile, unit);
    return unit;
  }

  placeUnit(side, type) {
    const n = this.units.filter((u) => u.side === side && unitType(u) === type).length;
    if (side === RIGHT) {
      if (type === "tank") this.units.push(new Tank(s(255) - n * s(64), side, this.terrain));
      if (type === "motorcycle") this.units.push(new Motorcycle(s(197) - n * s(46), side, this.terrain));
      if (type === "airplane") this.units.push(new Airplane(-s(70) - n * s(125), side, this.terrain, n));
      if (type === "bomber") this.units.push(new Bomber(-s(150) - n * s(145), side, this.terrain, n));
      if (type === "helicopter") this.units.push(new Helicopter(s(120) - n * s(95), side, this.terrain, n));
      if (type === "drone") this.units.push(new Drone(s(72) - n * s(18), side, this.terrain, n));
      if (type === "castle") this.units.push(new Castle(s(86) - n * s(76), side, this.terrain));
      if (type === "soldier") this.units.push(new Soldier(s(140) - n * s(18), side, this.terrain));
      if (type === "medic") this.units.push(new Medic(s(110) - n * s(26), side, this.terrain));
      if (type === "mortar") this.units.push(new MortarHen(s(60) + n * s(40), side, this.terrain));
      if (type === "rider") this.units.push(new RoosterRider(s(230) - n * s(30), side, this.terrain));
      if (type === "catapult") this.units.push(new CatapultWagon(s(40) + n * s(52), side, this.terrain));
      if (type === "truck") this.units.push(new MonsterTruck(s(200) - n * s(56), side, this.terrain));
      if (type === "balloon") this.units.push(new ChickBalloon(-s(60) - n * s(100), side, this.terrain, n));
    } else {
      if (type === "tank") this.units.push(new Tank(W - s(255) + n * s(64), side, this.terrain));
      if (type === "motorcycle") this.units.push(new Motorcycle(W - s(197) + n * s(46), side, this.terrain));
      if (type === "airplane") this.units.push(new Airplane(W + s(70) + n * s(125), side, this.terrain, n));
      if (type === "bomber") this.units.push(new Bomber(W + s(150) + n * s(145), side, this.terrain, n));
      if (type === "helicopter") this.units.push(new Helicopter(W - s(120) + n * s(95), side, this.terrain, n));
      if (type === "drone") this.units.push(new Drone(W - s(72) + n * s(18), side, this.terrain, n));
      if (type === "castle") this.units.push(new Castle(W - s(86) + n * s(76), side, this.terrain));
      if (type === "soldier") this.units.push(new Soldier(W - s(140) + n * s(18), side, this.terrain));
      if (type === "medic") this.units.push(new Medic(W - s(110) + n * s(26), side, this.terrain));
      if (type === "mortar") this.units.push(new MortarHen(W - s(60) - n * s(40), side, this.terrain));
      if (type === "rider") this.units.push(new RoosterRider(W - s(230) + n * s(30), side, this.terrain));
      if (type === "catapult") this.units.push(new CatapultWagon(W - s(40) - n * s(52), side, this.terrain));
      if (type === "truck") this.units.push(new MonsterTruck(W - s(200) + n * s(56), side, this.terrain));
      if (type === "balloon") this.units.push(new ChickBalloon(W + s(60) + n * s(100), side, this.terrain, n));
    }
  }

  update(dt) {
    Music.update(this, dt);
    Achievements.update(dt);
    this.clouds.forEach((c) => {
      c.x += c.speed * dt;
      if (c.x - 100 * c.scale > W) c.x = -100 * c.scale;
    });
    this.background.update(dt);
    if (this.scene !== "battle") {
      Effects.shakeX = Effects.shakeY = 0;
      return;
    }
    Tutorial.update(this, dt);
    this.updateWreckage(dt);
    for (const splat of this.splats) splat.update(dt);
    if (this.splats.length && this.splats[0].faded) this.splats = this.splats.filter((splat) => !splat.faded);
    Effects.update(dt, this.terrain);
    Weather.update(dt, this.terrain);
    this.units.forEach((u) => {
      if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt);
      if (u.recoil > 0) u.recoil = Math.max(0, u.recoil - dt * 6);
    });
    this.titleTimer = Math.max(0, this.titleTimer - dt);
    this.rallyTimer = Math.max(0, (this.rallyTimer || 0) - dt);
    this.personalityTimer = Math.max(0, (this.personalityTimer || 0) - dt);
    this.units.forEach((u) => {
      if (u.shieldFlash > 0) u.shieldFlash = Math.max(0, u.shieldFlash - dt);
    });
    if (this.noticeBubble) this.noticeBubble.timer = Math.max(0, this.noticeBubble.timer - dt);
    this.units.forEach((u) => {
      if (u.labelTimer !== undefined) u.labelTimer = Math.max(0, u.labelTimer - dt);
    });
    if (this.winner) {
      Results.update(this, dt);
      return;
    }
    this.roundTime += dt;
    Stats.add("playSeconds", dt);
    this.powerUpCooldown = Math.max(0, this.powerUpCooldown - dt);
    Abilities.update(this, dt);
    Hazards.update(this, dt);
    Events.update(this, dt);
    Weather.updateBattle(this, dt);
    Reinforcements.update(this, dt);
    EggTypes.update(dt);

    const blue = this.living(RIGHT);
    const red = this.living(LEFT);
    if (!blue.length || !red.length) {
      this.finishRound(blue.length > 0, red.length === 0);
      return;
    }
    if (this.roundTime >= this.roundLimit) {
      this.finishRound(this.armyScore(blue) >= this.armyScore(red), false);
      return;
    }

    for (const u of this.living()) {
      const enemies = u.side === RIGHT ? red : blue;
      if (this.canSpeak(u)) u.updateSpeech(dt);
      if (u.frozen > 0) {
        u.frozen = Math.max(0, u.frozen - dt);
        continue;
      }
      const udt = (u.stuck > 0 ? dt * STICKY_SLOW : dt) * Events.speedFactor(u) * Abilities.timeScale(u);
      if (u.stuck > 0) u.stuck = Math.max(0, u.stuck - dt);
      if (Events.tickUnit(this, u, dt)) continue;
      u.move(udt * Hazards.speedFactor(u), enemies);
      if (u.isBoss) {
        u.updateBoss(this, udt, enemies);
        continue;
      }
      if (u instanceof Drone && u.impactTarget) {
        this.detonateDrone(u, u.impactTarget);
        continue;
      }
      if (u instanceof Drone) continue;
      if (u.ready(udt)) this.fire(u, enemies);
    }

    for (const e of [...this.eggs]) {
      if (e.kind.homing) EggTypes.steer(e, e.side === RIGHT ? red : blue, dt);
      e.update(dt);
      const children = EggTypes.maybeSplit(e);
      if (children) {
        this.removeEgg(e);
        this.eggs.push(...children);
        audio.play("fire");
        continue;
      }
      const enemies = e.side === RIGHT ? red : blue;
      for (const t of enemies) {
        if (dist(e.x, e.y, t.x, t.y) <= e.radius + t.radius()) {
          if (e.kind.explode) {
            this.explode(e, e.x, e.y);
            break;
          }
          t.takeHit();
          if (e.kind.sticky) t.stuck = Math.max(t.stuck || 0, e.kind.sticky);
          EggTypes.onImpact(this, e, e.x, e.y, t);
          for (let extra = 1; extra < e.kind.damage && !t.dead; extra++) t.takeHit();
          if (e.side === RIGHT && !t.dead && Math.random() < Armory.doubleHitChance(Armory.level(this.profile, "dmg"))) t.takeHit();
          this.maybeSay(t, settings.speechHitComments, 1.05);
          if (t.dead) {
            this.onUnitKilled(t, e.source);
            this.playUnitDestroyed(t);
            this.addWreckage(t);
          } else {
            this.playUnitHit(t);
          }
          if (e.burst) this.burst(e, e.x, e.y, false);
          this.removeEgg(e);
          break;
        }
      }
      if (!this.eggs.includes(e)) continue;
      if (e.vy > 0 && e.y + e.radius >= this.terrain.yAt(e.x) && e.bouncesLeft > 0) {
        this.bounceEgg(e);
        continue;
      }
      if (e.vy > 0 && e.y + e.radius >= this.terrain.yAt(e.x) && e.kind.explode) {
        this.explode(e, e.x, this.terrain.yAt(e.x));
        continue;
      }
      if (e.vy > 0 && e.y + e.radius >= this.terrain.yAt(e.x)) {
        EggTypes.onImpact(this, e, e.x, this.terrain.yAt(e.x));
        if (e.burst) this.burst(e, e.x, this.terrain.yAt(e.x), true);
        else this.addTerrainSplat(e.x);
        this.removeEgg(e);
      }
      if (e.x < -80 || e.x > W + 80 || e.y > H + 80) this.removeEgg(e);
    }

    this.units = this.units.filter((u) => !u.dead);
  }

  detonateDrone(drone, target) {
    if (drone.dead || target.dead) return;
    target.takeHit();
    this.maybeSay(target, settings.speechHitComments, 1.05);
    this.playUnitHit(target);
    if (target.dead) {
      this.onUnitKilled(target);
      this.playUnitDestroyed(target);
      this.addWreckage(target);
    }
    drone.dead = true;
    this.playUnitDestroyed(drone);
    this.addWreckage(drone);
    for (let i = 0; i < drone.bombBurst; i++) {
      const angle = (145 - i * 70) * Math.PI / 180;
      const speed = rand(105, 145);
      this.eggs.push(new Egg(
        drone.x,
        drone.y,
        Math.cos(angle) * speed,
        -Math.abs(Math.sin(angle) * speed) - rand(10, 45),
        drone.side,
      ));
    }
  }

  onUnitKilled(unit, source = null) {
    Objectives.onKill(this, unit, source);
    if (unit.side === LEFT && !this.winner) this.roundKills++;
  }

  addWreckage(unit) {
    if (!settings.showWreckage) return;
    if (unit instanceof Airplane) {
      this.addAircraftDebris(unit);
      return;
    }
    let kind = null;
    if (unit instanceof Tank || unit instanceof MonsterTruck || unit instanceof CatapultWagon) kind = "tank";
    if (unit instanceof Motorcycle) kind = "motorcycle";
    if (unit instanceof Castle) kind = "castle";
    if (!kind) return;
    this.wreckage.push({ kind, x: unit.x, y: this.terrain.yAt(unit.x) });
    this.wreckage = this.wreckage.slice(-80);
  }

  addAircraftDebris(unit) {
    const count = unit instanceof Drone ? 3 : unit instanceof Bomber ? 7 : 5;
    const baseSpeed = unit.speed * unit.direction();
    for (let i = 0; i < count; i++) {
      this.wreckage.push({
        kind: "air_debris",
        x: unit.x + rand(-s(18), s(18)),
        y: unit.y + rand(-s(10), s(10)),
        vx: baseSpeed * rand(0.25, 0.75) + rand(-55, 55),
        vy: rand(-80, 25),
        angle: rand(0, Math.PI * 2),
        spin: rand(-4.5, 4.5),
        length: rand(14, 34),
        landed: false,
      });
    }
    this.wreckage = this.wreckage.slice(-100);
  }

  updateWreckage(dt) {
    if (!settings.showWreckage) return;
    for (const w of this.wreckage) {
      if (w.kind !== "air_debris" || w.landed) continue;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.vy += GRAVITY * dt;
      w.angle += w.spin * dt;
      const surfaceY = this.terrain.yAt(w.x);
      if (w.y >= surfaceY) {
        w.y = surfaceY;
        w.vx = 0;
        w.vy = 0;
        w.spin = 0;
        w.landed = true;
      }
    }
  }

  living(side = null) {
    return this.units.filter((u) => !u.dead && (side === null || u.side === side));
  }

  canSpeak(u) {
    return settings.speechBubbleFrequency > 0 && !(u instanceof Airplane);
  }

  maybeSay(u, comments, duration = 1.2) {
    if (comments.length && this.canSpeak(u) && Math.random() < Math.min(1, settings.speechBubbleFrequency)) {
      u.say(choice(comments), duration);
    }
  }

  fire(u, enemies) {
    if (!enemies.length) return;
    if (u instanceof ChickBalloon) return this.dropChick(u, enemies);
    if (u instanceof MonsterTruck) return this.crush(u, enemies);
    if (u instanceof Helicopter) {
      const enemyAir = enemies.filter((e) => e instanceof Airplane);
      const enemyGroundGone = !enemies.some((e) => e instanceof Castle || e instanceof Tank || e instanceof Motorcycle || e instanceof Soldier);
      if (enemyAir.length && enemyGroundGone) return this.shootAir(u, enemyAir);
      return this.dropHelicopterBomb(u, enemies);
    }
    if (u instanceof Airplane) {
      const enemyAir = enemies.filter((e) => e instanceof Airplane);
      const enemyGroundGone = !enemies.some((e) => e instanceof Castle || e instanceof Tank || e instanceof Motorcycle || e instanceof Soldier);
      if (enemyAir.length && enemyGroundGone) return this.shootAir(u, enemyAir);
      return this.dropBomb(u, enemies);
    }
    if (u instanceof Medic) return this.heal(u);
    if (u.melee) return this.peck(u, enemies);
    const targets = this.targetsInRangeFor(u, enemies);
    if (!targets.length) {
      u.fireClock = 0.08;
      return;
    }
    const target = targets.reduce((a, b) => Math.abs(a.x - u.x) < Math.abs(b.x - u.x) ? a : b);
    const [sx, sy] = u.muzzle();
    const tx = target.x + rand(-16, 16) + EggTypes.aimError(u);
    const ty = target.y - target.size * 0.55 + rand(-12, 10);
    const t = u.lobTime ? rand(u.lobTime[0], u.lobTime[1]) : clamp(Math.abs(tx - sx) / rand(215, 275), 0.85, 2.6);
    const vx = (tx - sx) / t;
    const vy = (ty - sy - 0.5 * GRAVITY * t * t) / t;
    if (u.aim) u.aim(vx, vy);
    const burst = u.eggBurst ?? (u instanceof Castle ? u.bombBurst : u instanceof Tank ? 3 : 0);
    this.eggs.push(new Egg(sx, sy, vx, vy, u.side, burst, u.side === LEFT ? Personalities.eggKind(this.personality) : "normal"));
    Effects.muzzle(sx, sy, Math.sign(vx) || u.side);
    if (u instanceof Tank || u instanceof Castle) u.recoil = 1;
    if (u.side === RIGHT) Stats.add("eggsThrown");
    this.maybeSay(u, settings.speechFireComments, 0.95);
    audio.play("fire");
  }

  // Fires an egg from (sx, sy) that lands on (tx, ty) after `time` seconds.
  lobEgg(sx, sy, tx, ty, side, burst = 0, time = 1.5, kind = "normal") {
    const vx = (tx - sx) / time;
    const vy = (ty - sy - 0.5 * GRAVITY * time * time) / time;
    this.eggs.push(new Egg(sx, sy, vx, vy, side, burst, kind));
  }

  // Chick Balloon: once over enemy ground troops, drop a chick paratrooper.
  dropChick(u, enemies) {
    const below = enemies.some((e) => !(e instanceof Airplane) && Math.abs(e.x - u.x) < s(90));
    if (!u.chicksLeft || !below) {
      u.fireClock = 0.3;
      return;
    }
    u.chicksLeft--;
    const chick = makeChick(u);
    if (u.side === RIGHT) {
      Armory.upgradeUnit(this.profile, chick);
      Stats.add("chicksDropped");
    }
    this.units.push(chick);
    audio.play("squeak");
  }

  // Monster Truck: flattens infantry it is driving over, and rams whatever blocks it.
  crush(u, enemies) {
    let hitAny = false;
    for (const e of enemies) {
      if (e instanceof Airplane || e.airborne) continue;
      const gap = Math.abs(e.x - u.x);
      if (e instanceof Soldier ? gap < u.size * 0.55 : gap - e.blockingRadius() <= u.blockingRadius() + s(10)) {
        this.damageUnit(e, e instanceof Soldier ? 2 : 1);
        if (e.dead && u.side === RIGHT) Stats.add("truckKills");
        hitAny = true;
        if (!(e instanceof Soldier)) break;
      }
    }
    if (hitAny) {
      Effects.debris(u.x + u.side * u.size * 0.4, u.y + s(10), 3, LINE);
      audio.play("tank_hit");
    } else {
      u.fireClock = 0.1;
    }
  }

  // Medic: heal the most damaged ally in range by one hit point.
  heal(u) {
    let best = null;
    for (const ally of this.living(u.side)) {
      if (ally === u || !(ally.maxHp > ally.hp) || dist(u.x, u.y, ally.x, ally.y) > u.healRange) continue;
      if (!best || ally.hp / ally.maxHp < best.hp / best.maxHp) best = ally;
    }
    if (!best) {
      u.fireClock = 0.3;
      return;
    }
    best.hp = Math.min(best.maxHp, best.hp + 1);
    for (let i = 0; i < 4; i++) Effects.spawn("spark", best.x + rand(-8, 8), best.y - best.size * 0.4, rand(-10, 10), rand(-70, -40), 0.5, 5, "#5cbf3a");
    audio.play("tick");
  }

  // Rooster Rider: peck the closest ground enemy within reach.
  peck(u, enemies) {
    const reach = u.blockingRadius() + s(26);
    let target = null;
    for (const e of enemies) {
      if (e instanceof Airplane) continue;
      const gap = Math.abs(e.x - u.x) - e.blockingRadius();
      if (gap <= reach && (!target || Math.abs(e.x - u.x) < Math.abs(target.x - u.x))) target = e;
    }
    if (!target) {
      u.fireClock = 0.1;
      return;
    }
    this.damageUnit(target, 1);
    Effects.sparks(target.x - u.side * target.radius() * 0.4, target.y - target.size * 0.3, 5);
  }

  projectileRangeMultiplierFor(u) {
    if (u instanceof MortarHen) return 1;
    if (u instanceof Motorcycle) return settings.motorcycleProjectileRangeMultiplier;
    if (u instanceof Soldier) return settings.soldierProjectileRangeMultiplier;
    return 1;
  }

  targetsInRangeFor(u, enemies) {
    const rangeMultiplier = this.projectileRangeMultiplierFor(u);
    const sight = Weather.visibility();
    if (rangeMultiplier >= 1 && sight === Infinity) return enemies;
    const maxRange = Math.min(W * rangeMultiplier, sight);
    return enemies.filter((enemy) => Math.abs(enemy.x - u.x) <= maxRange);
  }

  dropHelicopterBomb(u, enemies) {
    const ground = enemies.filter((e) => e instanceof Castle || e instanceof Tank || e instanceof Motorcycle || e instanceof Soldier);
    const targets = ground.length ? ground : enemies;
    const [sx, sy] = u.bombBay();
    const target = targets.reduce((a, b) => Math.abs(a.x - sx) + Math.abs(a.y - sy) < Math.abs(b.x - sx) + Math.abs(b.y - sy) ? a : b);
    const dx = target.x + rand(-s(12), s(12)) - sx;
    const dy = target.y - target.size * 0.25 - sy;
    const time = clamp(Math.sqrt(Math.abs(dy) / GRAVITY) * 1.45, 0.6, 1.8);
    const vx = clamp(dx / time, -u.bombSpeed, u.bombSpeed);
    const vy = (dy - 0.5 * GRAVITY * time * time) / time;
    this.eggs.push(new Egg(sx, sy, vx, vy, u.side, u.bombBurst));
    if (u.side === RIGHT) Stats.add("eggsThrown");
    this.maybeSay(u, settings.speechFireComments, 0.95);
    audio.play("fire");
  }

  dropBomb(u, enemies) {
    const [sx, sy] = u.bombBay();
    const vx = u.side * u.bombSpeed;
    const ground = enemies.filter((e) => e instanceof Castle || e instanceof Tank || e instanceof Motorcycle || e instanceof Soldier);
    const targets = ground.length ? ground : enemies;
    const candidates = targets.map((target) => {
      const dx = target.x - sx;
      if (dx * u.side <= 0) return null;
      const time = dx / vx;
      const vy = (target.y - sy - 0.5 * GRAVITY * time * time) / time;
      return vy >= -55 && vy <= 95 ? { vy, score: Math.abs(vy - 20) } : null;
    }).filter(Boolean);
    if (!candidates.length) {
      u.fireClock = 0.08;
      return;
    }
    candidates.sort((a, b) => a.score - b.score);
    this.eggs.push(new Egg(sx, sy, vx, candidates[0].vy, u.side, u.bombBurst));
    if (u.side === RIGHT) Stats.add("eggsThrown");
    this.maybeSay(u, settings.speechFireComments, 0.95);
    audio.play("fire");
  }

  shootAir(u, enemies) {
    const close = enemies.filter((e) => dist(e.x, e.y, u.x, u.y) <= settings.airplaneFireRange);
    if (!close.length) {
      u.fireClock = 0.08;
      return;
    }
    const target = close[0];
    const [sx, sy] = u.muzzle();
    const tx = target.x + rand(-settings.airplaneShotSpread, settings.airplaneShotSpread);
    const ty = target.y + rand(-settings.airplaneShotSpread * 0.6, settings.airplaneShotSpread * 0.6);
    const d = Math.max(1, Math.hypot(tx - sx, ty - sy));
    this.eggs.push(new Egg(sx, sy, (tx - sx) / d * settings.airplaneShotSpeed, (ty - sy) / d * settings.airplaneShotSpeed, u.side));
    if (u.side === RIGHT) Stats.add("eggsThrown");
    this.maybeSay(u, settings.speechFireComments, 0.95);
    audio.play("fire");
  }

  burst(egg, x, y, leaveSplat) {
    Effects.yolk(x, y, 6 + egg.burst, 1.2);
    Effects.spawn("ring", x, y, 0, 0, 0.3, 6 + egg.burst, YOLK);
    if (leaveSplat) this.splats.push(new Splat(x, y + rand(0, s(10)), this.terrain.slopeAt(x), 1 + Math.min(0.6, egg.burst * 0.05)));
    Effects.shells(x, y, 3);
    for (let i = 0; i < egg.burst; i++) {
      const p = i / Math.max(1, egg.burst - 1);
      const angle = (160 - p * 140) * Math.PI / 180;
      const speed = rand(115, 175);
      const child = new Egg(x, y - egg.radius, Math.cos(angle) * speed, -Math.abs(Math.sin(angle) * speed) - rand(20, 65), egg.side, 0, egg.kind.burstKind || "normal");
      child.source = egg.source;
      this.eggs.push(child);
    }
    audio.play("egg_splat");
  }

  // Applies `hits` hits to a unit with all the usual feedback (kills, wreckage, sounds).
  damageUnit(t, hits, source = null) {
    if (t.dead) return;
    for (let i = 0; i < hits && !t.dead; i++) t.takeHit();
    this.maybeSay(t, settings.speechHitComments, 1.05);
    if (t.dead) {
      this.onUnitKilled(t, source);
      this.playUnitDestroyed(t);
      this.addWreckage(t);
    } else {
      this.playUnitHit(t);
    }
  }

  // Explosive eggs: area damage to the other army plus a crater (see EGG_TYPES.explosive).
  explode(e, x, y) {
    const { radius, depth } = e.kind.explode;
    const r = s(radius * 2);
    const targets = this.living(e.side === RIGHT ? LEFT : RIGHT);
    for (const t of targets) {
      const d = dist(x, y, t.x, t.y) - t.radius() * 0.5;
      if (d > r) continue;
      this.damageUnit(t, d < r * 0.5 ? e.kind.damage : 1, e.source);
    }
    this.removeEgg(e);
    Effects.explosion(x, y, 2.2, LINE);
    Effects.spawn("ring", x, y, 0, 0, 0.45, r * 0.4, RED);
    Effects.shake(9);
    audio.play("tank_destroyed");
    const ground = this.terrain.yAt(x);
    if (y >= ground - s(140) && this.terrain.crater(x, r * 1.1, s(depth * 2))) {
      // Debris thrown from the crater, and things resting on the old surface settle into it.
      Effects.debris(x, ground, 8, LINE);
      for (const splat of this.splats) if (Math.abs(splat.x - x) < r * 1.1) splat.age = Math.max(splat.age, 13);
      for (const w of this.wreckage) if (w.kind !== "air_debris" || w.landed) w.y = this.terrain.yAt(w.x);
    }
    if (e.burst) this.burst(e, x, Math.min(y, this.terrain.yAt(x)), false);
  }

  // A bouncing egg hops off the ground, throwing a small burst each time.
  bounceEgg(e) {
    const ground = this.terrain.yAt(e.x);
    e.bouncesLeft--;
    e.y = ground - e.radius;
    e.vy = -Math.max(140, Math.abs(e.vy) * 0.62);
    e.vx *= 0.9;
    const hop = { ...e, burst: e.kind.bounceBurst || 0, kind: EggTypes.get("normal") };
    if (hop.burst) this.burst(hop, e.x, ground, true);
    else this.addTerrainSplat(e.x);
  }

  addTerrainSplat(x) {
    const surfaceY = this.terrain.yAt(x);
    this.splats.push(new Splat(x, surfaceY + rand(0, s(10)), this.terrain.slopeAt(x), rand(0.8, 1.05)));
    this.splats = this.splats.slice(-90);
    Effects.shells(x, surfaceY - 3, 2);
    Effects.yolk(x, surfaceY, 4, 0.8);
    audio.play("egg_splat");
  }

  playUnitDestroyed(unit) {
    const big = unit.isBoss ? 4 : unit instanceof Castle ? 2.2 : unit instanceof Tank || unit instanceof Bomber ? 1.5 : unit instanceof Soldier ? 0.6 : 1;
    Effects.explosion(unit.x, unit.y, big, teamColor(unit.side));
    if (big >= 1.5) Effects.shake(big * 3.5);
    if (unit instanceof Soldier) audio.play("soldier_destroyed");
    else audio.play("tank_destroyed");
  }

  playUnitHit(unit) {
    unit.hitFlash = 0.18;
    Effects.sparks(unit.x, unit.y - unit.size * 0.3, 4);
    Effects.yolk(unit.x, unit.y - unit.size * 0.3, 3, 0.7);
    if (unit instanceof Soldier) audio.play("soldier_hit");
    else audio.play("tank_hit");
  }

  dropPowerUp(x) {
    if (this.winner || this.powerUpCooldown > 0) return false;
    const targetX = clamp(x, s(40), W - s(40));
    const kind = EggTypes.selected(this.profile);
    const count = kind.yolkCount || 1;
    for (let i = 0; i < count; i++) {
      const vx = kind.dropVx ? kind.dropVx * RIGHT : count > 1 ? (i - (count - 1) / 2) * 60 : rand(-18, 18);
      const egg = new Egg(targetX + (i - (count - 1) / 2) * 20, 72, vx, 30, RIGHT, kind.yolkBurst, kind.id);
      egg.source = "yolk";
      this.eggs.push(egg);
      Stats.add("eggsThrown");
    }
    this.powerUpCooldown = Armory.yolkCooldown(this.profile);
    audio.play("fire");
    Tutorial.notify("yolk");
    return true;
  }

  removeEgg(e) {
    const i = this.eggs.indexOf(e);
    if (i >= 0) this.eggs.splice(i, 1);
  }

  draw() {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(Effects.shakeX, Effects.shakeY);
    this.background.draw();
    Sky.drawSky(this);
    this.background.drawSunOrMoon();
    this.clouds.forEach((c) => drawCloud(c.x, c.y, c.scale));
    this.terrain.draw();
    this.splats.forEach((splat) => splat.draw());
    Sky.drawShade();
    Hazards.draw(this);
    Weather.drawWindSock(this.terrain);
    if (settings.showWreckage) this.wreckage.forEach((w) => drawWreckage(w));
    this.eggs.forEach((e) => e.draw());
    this.units.sort((a, b) => a.y - b.y).forEach((u) => {
      if (u.maxHp === undefined || u.hp > u.maxHp) u.maxHp = u.hp;
      Events.drawUnit(u, () => withHitFlash(u, () => u.draw()));
      if (u.hp < u.maxHp && u.hp > 0) drawCracks(u.x, u.y, u.size, 1 - u.hp / u.maxHp, u.wobble);
    });
    this.drawGoo();
    EggTypes.drawIce(this.units);
    Events.draw(this);
    this.drawHealthBars();
    Abilities.drawAirstrikes(this);
    EggTypes.draw();
    Effects.draw();
    Weather.draw();
    Weather.drawOverlay(this);
    Abilities.drawChill(this);
    this.units.sort((a, b) => a.y - b.y).forEach((u) => {
      if (this.canSpeak(u)) drawSpeechBubble(u);
    });
    this.drawShields();
    this.drawUnitLabels();
    ctx.restore();
    if (this.scene !== "title") {
      Hud.draw(this);
    }
    this.drawNoticeBubble();
    this.drawStartTitle();
    if (this.winner) Results.draw(this);
    this.drawRallyBanner();
    Objectives.draw(this);
    this.drawPersonalityBanner();
    Events.drawBanner(this);
    Reinforcements.drawBanner(this);
    Bosses.drawBar(this);
    Achievements.drawToast();
    Tutorial.draw(this);
    if (this.scene !== "battle") Menus.draw(this);
    drawScreenBorder();
  }

  drawStartTitle() {
    if (this.titleTimer <= 0 || this.winner || this.scene !== "battle") return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.titleTimer / 0.8);
    ctx.fillStyle = LINE;
    ctx.font = "bold 54px Courier New";
    centerText("EGG WARS", H / 2);
    ctx.restore();
  }

  drawNoticeBubble() {
    if (!this.noticeBubble || this.noticeBubble.timer <= 0) return;
    ctx.font = "bold 18px Courier New";
    const padX = 8;
    const padY = 5;
    const text = this.noticeBubble.text;
    const textW = ctx.measureText(text).width;
    const bubbleW = textW + padX * 2;
    const bubbleH = 30;
    const x = clamp(this.noticeBubble.x - bubbleW / 2, 8, W - bubbleW - 8);
    const y = clamp(this.noticeBubble.y, 8, H - bubbleH - 8);
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, bubbleW, bubbleH);
    ctx.strokeRect(x, y, bubbleW, bubbleH);
    const tailX = clamp(this.noticeBubble.x, x + 8, x + bubbleW - 8);
    ctx.beginPath();
    ctx.moveTo(tailX - 5, y + 1);
    ctx.lineTo(tailX + 5, y + 1);
    ctx.lineTo(tailX, y - 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINE;
    ctx.fillText(text, x + padX, y + bubbleH - padY - 4);
  }

  drawXpBar(x, y, width) {
    const p = this.profile;
    const need = Progression.xpToNext(p.level);
    const frac = clamp(p.xp / need, 0, 1);
    ctx.font = "bold 16px Courier New";
    ctx.fillStyle = LINE;
    const label = `LV ${p.level}`;
    ctx.fillText(label, x, y + 13);
    const labelW = ctx.measureText(label + " ").width;
    const geText = ` ${p.goldenEggs} GE`;
    const geW = ctx.measureText(geText).width;
    const barX = x + labelW;
    const barW = width - labelW - geW - 26;
    ctx.fillStyle = rgbaFromHex(YOLK, 0.85);
    ctx.fillRect(barX, y + 2, barW * frac, 12);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, y + 2, barW, 12);
    ctx.fillStyle = LINE;
    this.drawGoldenEggIcon(barX + barW + 14, y + 8, 7);
    ctx.fillText(geText, barX + barW + 20, y + 13);
  }

  drawGoldenEggIcon(x, y, r) {
    ctx.fillStyle = YOLK;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINE;
  }

  drawGoo() {
    ctx.save();
    for (const u of this.units) {
      if (!(u.stuck > 0)) continue;
      ctx.globalAlpha = Math.min(1, u.stuck) * 0.8;
      ctx.fillStyle = "rgba(120,190,60,0.75)";
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      const r = u.radius() * 0.55;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(u.x + (i - 1) * r * 0.7, u.y + r * 0.2 + Math.sin(performance.now() * 0.004 + i) * 1.5, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawHealthBars() {
    for (const u of this.units) {
      if (u.isBoss || !(u.maxHp > 1) || u.hp >= u.maxHp || u.hp <= 0) continue;
      const w = clamp(u.size * 0.9, 18, 46);
      const x = u.x - w / 2;
      const y = u.y - u.radius() - 10;
      const frac = u.hp / u.maxHp;
      ctx.fillStyle = PAPER;
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = frac > 0.5 ? teamColor(u.side) : frac > 0.25 ? YOLK : RED;
      ctx.fillRect(x, y, w * frac, 5);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, 5);
    }
  }

  drawShields() {
    ctx.save();
    ctx.lineWidth = 2;
    for (const u of this.units) {
      if (!(u.shield > 0) && !(u.shieldFlash > 0)) continue;
      const r = u.radius() + s(6);
      ctx.strokeStyle = u.shieldFlash > 0 ? LINE : YOLK;
      ctx.globalAlpha = u.shield > 0 ? 0.75 : u.shieldFlash / 0.35;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(u.x, u.y - s(4), r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Announces the enemy personality at the start of a stage.
  drawPersonalityBanner() {
    if (!this.personalityTimer || this.winner || this.scene !== "battle") return;
    const p = this.bossStage && this.boss
      ? { name: this.boss.name, tell: "Boss battle! Its health bar is at the top. It gets angry below half health." }
      : this.personality;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.personalityTimer / 0.6, (4.5 - this.personalityTimer) * 4);
    const y = this.rallyTimer > 0 ? 240 : 186;
    ctx.font = "bold 28px Courier New";
    const titleW = ctx.measureText(`BOSS: ${p.name}`).width;
    ctx.font = "bold 16px Courier New";
    const w = Math.max(titleW, ctx.measureText(p.tell).width) + 40;
    const x = (W - w) / 2;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, w, 62);
    ctx.strokeRect(x, y, w, 62);
    ctx.fillStyle = RED;
    ctx.font = "bold 28px Courier New";
    centerText(`${this.bossStage ? "BOSS" : "ENEMY"}: ${p.name}`, y + 30);
    ctx.fillStyle = LINE;
    ctx.font = "bold 16px Courier New";
    centerText(p.tell, y + 52);
    ctx.restore();
  }

  drawRallyBanner() {
    if (!this.rallyTimer || this.winner) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.rallyTimer / 0.6);
    ctx.font = "bold 26px Courier New";
    const goldText = this.rallyGold ? `  +$${this.rallyGold}` : "";
    const shieldText = this.rally >= 2 ? "  +SHIELDS" : "";
    const text = `RALLY! Your troops are fired up${goldText}  +1 TANK${shieldText}`;
    const w = ctx.measureText(text).width + 32;
    const x = (W - w) / 2;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 3;
    ctx.fillRect(x, 182, w, 40);
    ctx.strokeRect(x, 182, w, 40);
    ctx.fillStyle = BLUE;
    ctx.fillText(text, x + 16, 210);
    ctx.restore();
  }



  drawUnitLabels() {
    ctx.font = "bold 14px Courier New";
    ctx.fillStyle = LINE;
    this.units.forEach((u) => {
      if (!u.label || !u.labelTimer) return;
      const width = ctx.measureText(u.label).width;
      ctx.fillText(u.label, u.x - width / 2, u.y - u.radius() - 12);
    });
  }

  wrapText(text, maxWidth) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let current = "";
    for (const word of words) {
      if (ctx.measureText(word).width > maxWidth) {
        if (current) {
          lines.push(current);
          current = "";
        }
        lines.push(...this.splitLongWord(word, maxWidth));
        continue;
      }
      if (!current) {
        current = word;
        continue;
      }
      const candidate = `${current} ${word}`;
      if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  splitLongWord(word, maxWidth) {
    const parts = [];
    let current = "";
    for (const char of word) {
      const candidate = current + char;
      if (current && ctx.measureText(candidate).width > maxWidth) {
        parts.push(current);
        current = char;
      } else {
        current = candidate;
      }
    }
    if (current) parts.push(current);
    return parts;
  }

  click(x, y) {
    if (this.winner) {
      const action = Results.click(this, x, y);
      if (action === "armory") Menus.openArmory(this, "battle");
      else if (action === "continue") {
        this.endPractice();
        this.startStage();
      }
      return;
    }
    const b = this.buttonAt(x, y);
    if (b) this.buyUnit(b);
    else this.dropPowerUp(x);
  }

  buyUnit(button) {
    if (button.side !== RIGHT) return;
    if (!Unlocks.unitUnlocked(this.profile, button.type)) {
      audio.play("deny");
      this.noticeBubble = {
        text: `Unlocks at level ${Unlocks.unitUnlockLevel(button.type)}.`,
        x: button.x + button.w / 2,
        y: button.y + button.h + 8,
        timer: 1.5,
      };
      return;
    }
    const cost = Armory.unitCost(this.profile, button.type);
    if (this.gold < cost) {
      audio.play("deny");
      const bubbleX = Number.isFinite(button.x) ? button.x + button.w / 2 : 120;
      const bubbleY = Number.isFinite(button.y) ? button.y + button.h + 8 : 72;
      this.noticeBubble = {
        text: "Not enough gold. Win rounds to earn more!",
        x: bubbleX,
        y: bubbleY,
        timer: 1.25,
      };
      return;
    }
    this.gold -= cost;
    if (this.track) this.track.bought = true;
    SaveManager.data.stats.unitsBought++;
    Stats.add(`bought_${button.type}`);
    Achievements.check(this);
    audio.play("coin");
    this.addUnit(button.side, button.type);
    this.saveProfile();
    Tutorial.notify("bought");
  }

  buttonAt(x, y) {
    return this.buttons.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  }

  restart() {
    this.startStage();
  }
}

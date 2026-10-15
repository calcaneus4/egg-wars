"use strict";

// Player abilities with cooldowns (DESIGN.md section 8). The Yolk Drop is aimed by tapping the
// battlefield and keeps its own cooldown on the Game; the others fire from the ability bar or
// their hotkey. Quick Yolk in the Armory shortens every cooldown.

// Powers. The player equips two of them in the W and E slots (the loadout, chosen on the Powers
// screen); unlocked powers fill empty slots automatically in POWER_FILL_ORDER.
const ABILITIES = [
  {
    id: "reinforce",
    name: "Reinforcements",
    level: 4,
    cooldown: 26,
    desc: "4 soldiers parachute in right beside your castle.",
  },
  {
    id: "airstrike",
    name: "Airstrike",
    level: 7,
    cooldown: 22,
    desc: "A bomber sweeps over the enemy half dropping a line of eggs.",
  },
  {
    id: "goose",
    name: "Golden Goose",
    level: 9,
    cooldown: 35,
    desc: "A goose waddles out and lays gold coins for 8 s.",
  },
  {
    id: "rooster",
    name: "Rooster Rally",
    level: 10,
    cooldown: 30,
    desc: "COCK-A-DOODLE! For 6 s your whole army moves and fires 40% faster.",
  },
  {
    id: "scarecrow",
    name: "Scarecrow",
    level: 14,
    cooldown: 30,
    desc: "A scarecrow pops up ahead of your army and draws the enemy's fire for 6 s.",
  },
  {
    id: "shield",
    name: "Shield",
    level: 12,
    cooldown: 32,
    desc: "Every unit in your army gains a shell shield that blocks one hit.",
  },
  {
    id: "timefreeze",
    name: "Time Freeze",
    level: 20,
    cooldown: 34,
    desc: "Every enemy egg in the air freezes for 4 s, then drops straight down.",
  },
  {
    id: "chill",
    name: "Big Chill",
    level: 17,
    cooldown: 40,
    desc: "A blizzard freezes every enemy solid for 2.5 s (bosses less).",
  },
  {
    id: "mega",
    name: "Mega Yolk",
    level: 21,
    cooldown: 30,
    desc: "Your Yolk Drop is ready now, and the next one is GIANT: triple burst.",
  },
];

const POWER_SLOT_KEYS = ["W", "E"];
const POWER_FILL_ORDER = ["airstrike", "shield", "reinforce", "goose", "rooster", "scarecrow", "chill", "timefreeze", "mega"];
const TIME_FREEZE_SECONDS = 4;
const GOOSE_SECONDS = 8;
// Row height on the Powers screen, so every power fits above the BACK button.
const POWER_ROW = 52;
const SCARECROW_SECONDS = 6;
const REINFORCE_COUNT = 4;
const ROOSTER_SECONDS = 6;
const ROOSTER_BOOST = 1.4;
const CHILL_SECONDS = 2.5;

const AIRSTRIKE_SPEED = 420;
const AIRSTRIKE_DROPS = 9;

const Abilities = {
  // The Scarecrow: a stand-in target the enemy shoots at instead of the player's army. It can't
  // be hurt and is only ever handed to ranged attacks (never to melee, rams or bosses).
  makeDecoy(game) {
    const front = game.living(RIGHT).filter((u) => Hazards.isGround(u)).reduce((m, u) => Math.max(m, u.x), s(150));
    const x = clamp(front + s(70), s(150), W * 0.62);
    const terrain = game.terrain;
    return {
      isDecoy: true,
      side: RIGHT,
      x,
      size: s(40),
      hp: 1,
      dead: false,
      timer: SCARECROW_SECONDS,
      get y() {
        return terrain.yAt(this.x) - s(30);
      },
      radius() {
        return s(20);
      },
      blockingRadius() {
        return s(14);
      },
    };
  },

  reset(game) {
    game.abilityCooldowns = {};
    game.decoy = null;
    game.goose = null;
    for (const a of ABILITIES) game.abilityCooldowns[a.id] = 0;
    game.airstrikes = [];
    game.megaYolk = false;
  },

  unlocked(profile, ability) {
    return profile.level >= ability.level;
  },

  get(id) {
    return ABILITIES.find((a) => a.id === id) || null;
  },

  // The two equipped powers (null for an empty slot). Keeps the player's picks, drops anything
  // not unlocked, and fills empty slots with unlocked powers.
  loadout(profile) {
    const picks = Array.isArray(profile.powers) ? profile.powers.slice(0, POWER_SLOT_KEYS.length) : [];
    const slots = POWER_SLOT_KEYS.map((_, i) => {
      const a = this.get(picks[i]);
      return a && this.unlocked(profile, a) ? a.id : null;
    });
    for (let i = 0; i < slots.length; i++) {
      if (slots[i]) continue;
      const next = POWER_FILL_ORDER.find((id) => this.unlocked(profile, this.get(id)) && !slots.includes(id));
      if (next) slots[i] = next;
    }
    profile.powers = slots;
    return slots.map((id) => this.get(id));
  },

  // Puts a power into a slot; if it was already in the other slot, the two swap.
  setSlot(profile, slot, id) {
    const slots = this.loadout(profile).map((a) => (a ? a.id : null));
    const other = slots.indexOf(id);
    if (other >= 0 && other !== slot) slots[other] = slots[slot];
    slots[slot] = id;
    profile.powers = slots;
  },

  useSlot(game, slot) {
    const a = this.loadout(game.profile)[slot];
    if (!a) {
      audio.play("deny");
      return false;
    }
    return this.use(game, a.id);
  },

  // Rooster Rally speeds up a unit's clock (movement and firing) while it lasts.
  timeScale(u) {
    return u.pumped > 0 ? ROOSTER_BOOST : 1;
  },

  update(game, dt) {
    for (const id of Object.keys(game.abilityCooldowns)) {
      game.abilityCooldowns[id] = Math.max(0, game.abilityCooldowns[id] - dt);
    }
    game.chillFlash = Math.max(0, (game.chillFlash || 0) - dt);
    game.timeFreeze = Math.max(0, (game.timeFreeze || 0) - dt);
    if (game.goose) {
      const g = game.goose;
      g.time += dt;
      g.x = Math.min(g.x + s(40) * dt, g.stopX);
      g.next -= dt;
      if (g.next <= 0 && g.time < GOOSE_SECONDS) {
        g.next = 1;
        const coin = 5 + Math.floor(game.stage / 5);
        game.gold += coin;
        g.pops.push({ x: g.x - s(14), y: game.terrain.yAt(g.x) - s(10), life: 1, text: `+$${coin}` });
        Effects.sparks(g.x - s(14), game.terrain.yAt(g.x) - s(6), 4, YOLK);
        audio.play("coin");
      }
      for (const pop of g.pops) pop.life -= dt;
      g.pops = g.pops.filter((pop) => pop.life > 0);
      if (g.time > GOOSE_SECONDS + 1) game.goose = null;
    }
    if (game.decoy && (game.decoy.timer -= dt) <= 0) {
      Effects.smoke(game.decoy.x, game.decoy.y, 6);
      game.decoy = null;
    }
    for (const u of game.units) {
      if (!(u.pumped > 0)) continue;
      u.pumped = Math.max(0, u.pumped - dt);
      if (Math.random() < dt * 4) Effects.spawn("spark", u.x + rand(-8, 8), u.y - u.size * 0.6, rand(-15, 15), rand(-60, -30), 0.4, 5, RED);
    }
    for (const strike of game.airstrikes) {
      strike.x += AIRSTRIKE_SPEED * dt;
      if (Math.random() < dt * 30) Effects.spawn("smoke", strike.x - 70, strike.y + 2, -30, -6, 0.5, 4, LINE);
      // Drop evenly spaced eggs while over the enemy half.
      while (strike.dropsLeft > 0 && strike.x >= strike.nextDropX) {
        game.eggs.push(new Egg(strike.x, strike.y + 16, AIRSTRIKE_SPEED * 0.25, 40, RIGHT, 2));
        Stats.add("eggsThrown");
        strike.dropsLeft--;
        strike.nextDropX += strike.spacing;
        audio.play("fire");
      }
    }
    game.airstrikes = game.airstrikes.filter((strike) => strike.x < W + 160);
  },

  use(game, id) {
    const ability = ABILITIES.find((a) => a.id === id);
    if (!ability || game.winner || game.scene !== "battle") return false;
    if (!this.loadout(game.profile).includes(ability)) return false;
    if (!this.unlocked(game.profile, ability) || game.abilityCooldowns[id] > 0) {
      audio.play("deny");
      return false;
    }
    game.abilityCooldowns[id] = ability.cooldown * Armory.cooldownScale(game.profile);
    Stats.add("powersUsed");
    if (id === "airstrike") {
      const start = W * 0.42;
      const end = W - s(60);
      game.airstrikes.push({ x: -120, y: H * 0.24, nextDropX: start, spacing: (end - start) / (AIRSTRIKE_DROPS - 1), dropsLeft: AIRSTRIKE_DROPS });
      audio.play("levelup");
    }
    if (id === "reinforce") {
      const castle = game.living(RIGHT).find((u) => u instanceof Castle);
      const baseX = castle ? castle.x : s(90);
      for (let i = 0; i < REINFORCE_COUNT; i++) {
        const trooper = new Soldier(baseX + s(30) + i * s(22), RIGHT, game.terrain);
        Armory.upgradeUnit(game.profile, trooper);
        trooper.parachute = true;
        trooper.airborne = true;
        trooper.lift = s(260) + i * s(40);
        game.units.push(trooper);
      }
      audio.play("start_reveille");
    }
    if (id === "timefreeze") {
      game.timeFreeze = TIME_FREEZE_SECONDS;
      audio.play("freeze");
    }
    if (id === "goose") {
      const castle = game.living(RIGHT).find((u) => u instanceof Castle);
      const x = castle ? castle.x + s(30) : s(80);
      game.goose = { x, stopX: x + s(120), time: 0, next: 0.6, pops: [] };
      audio.play("bawk");
    }
    if (id === "scarecrow") {
      game.decoy = this.makeDecoy(game);
      Effects.smoke(game.decoy.x, game.decoy.y + s(20), 5);
      audio.play("bawk");
    }
    if (id === "rooster") {
      for (const u of game.living(RIGHT)) u.pumped = ROOSTER_SECONDS;
      const talkers = game.living(RIGHT).filter((u) => game.canSpeak(u));
      if (talkers.length) choice(talkers).say("COCK-A-DOODLE-DOO!", 1.6);
      audio.play("crow");
    }
    if (id === "chill") {
      for (const u of game.living(LEFT)) EggTypes.freeze(u, CHILL_SECONDS);
      game.chillFlash = 0.6;
      for (let i = 0; i < 40; i++) Effects.spawn("drop", rand(W * 0.3, W), rand(0, H * 0.5), rand(-40, 40), rand(80, 200), rand(0.8, 1.4), rand(2, 3.5), WHITE);
      audio.play("freeze");
    }
    if (id === "mega") {
      game.megaYolk = true;
      game.powerUpCooldown = 0;
      Effects.spawn("ring", 46, H - 46, 0, 0, 0.6, 40, YOLK);
      audio.play("levelup");
    }
    if (id === "shield") {
      for (const u of game.living(RIGHT)) {
        u.shield = Math.max(u.shield || 0, 1);
        u.shieldFlash = 0.35;
      }
      Effects.spawn("ring", W * 0.2, H * 0.6, 0, 0, 0.6, 40, YOLK);
      audio.play("unlock");
    }
    return true;
  },

  // Small icon for a power, centred on (cx, cy).
  drawIcon(id, cx, cy) {
    ctx.save();
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 2;
    if (id === "airstrike") drawUnitIcon("bomber", cx, cy, 30, BLUE);
    else if (id === "reinforce") {
      drawUnitIcon("soldier", cx, cy + 5, 22, BLUE);
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 10, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (id === "rooster") {
      ctx.fillStyle = rgbaFromHex(YOLK, 0.6);
      ctx.beginPath();
      ctx.arc(cx - 2, cy + 3, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 8, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + 1, cy - 9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = YOLK;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy);
      ctx.lineTo(cx + 14, cy + 3);
      ctx.lineTo(cx + 6, cy + 6);
      ctx.fill();
    } else if (id === "timefreeze") {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      line(cx, cy, cx, cy - 8, BLUE, 2);
      line(cx, cy, cx + 6, cy + 3, BLUE, 2);
    } else if (id === "goose") {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy + 4, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      line(cx + 6, cy, cx + 8, cy - 10, LINE, 2);
      ctx.fillStyle = YOLK;
      ctx.beginPath();
      ctx.ellipse(cx - 9, cy + 11, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (id === "scarecrow") {
      line(cx, cy + 14, cx, cy - 6, "#8a5a2b", 2);
      line(cx - 12, cy - 2, cx + 12, cy - 2, "#8a5a2b", 2);
      ctx.fillStyle = "#e8c66a";
      ctx.beginPath();
      ctx.arc(cx, cy - 9, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#b5651d";
      ctx.fillRect(cx - 8, cy - 16, 16, 3);
    } else if (id === "chill") {
      ctx.strokeStyle = "#5aa8e0";
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * 13, cy - Math.sin(a) * 13);
        ctx.lineTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
        ctx.stroke();
      }
    } else if (id === "mega") {
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = YOLK;
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 6, 0, Math.PI * 2);
      ctx.fill();
      line(cx - 17, cy - 12, cx - 12, cy - 8, RED, 2);
      line(cx + 17, cy - 12, cx + 12, cy - 8, RED, 2);
      line(cx, cy - 19, cx, cy - 15, RED, 2);
    } else {
      ctx.fillStyle = rgbaFromHex(YOLK, 0.6);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 13);
      ctx.quadraticCurveTo(cx + 13, cy - 10, cx + 11, cy + 2);
      ctx.quadraticCurveTo(cx + 6, cy + 12, cx, cy + 15);
      ctx.quadraticCurveTo(cx - 6, cy + 12, cx - 11, cy + 2);
      ctx.quadraticCurveTo(cx - 13, cy - 10, cx, cy - 13);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  },

  drawGoose(game) {
    const g = game.goose;
    if (!g) return;
    const ground = game.terrain.yAt(g.x);
    const waddle = Math.sin(g.time * 10) * 0.12;
    const fade = Math.min(1, (GOOSE_SECONDS + 1 - g.time) * 2);
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    ctx.translate(g.x, ground);
    ctx.rotate(waddle);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    line(-s(4), -s(8), -s(6), 0, "#f0a030", 2);
    line(s(4), -s(8), s(6), 0, "#f0a030", 2);
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(0, -s(16), s(16), s(10), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s(10), -s(20));
    ctx.quadraticCurveTo(s(18), -s(30), s(14), -s(40));
    ctx.lineWidth = s(5);
    ctx.strokeStyle = LINE;
    ctx.stroke();
    ctx.lineWidth = s(3.5);
    ctx.strokeStyle = WHITE;
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = LINE;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(s(14), -s(42), s(5), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f0a030";
    ctx.beginPath();
    ctx.moveTo(s(18), -s(43));
    ctx.lineTo(s(25), -s(41));
    ctx.lineTo(s(18), -s(39));
    ctx.fill();
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(s(15), -s(43), 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.font = "bold 16px Courier New";
    for (const pop of g.pops) {
      ctx.globalAlpha = pop.life;
      ctx.fillStyle = "#e0a100";
      ctx.beginPath();
      ctx.ellipse(pop.x, pop.y, s(6), s(8), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = LINE;
      ctx.fillText(pop.text, pop.x - 10, pop.y - s(18) - (1 - pop.life) * 26);
    }
    ctx.restore();
  },

  drawDecoy(game) {
    const d = game.decoy;
    if (!d) return;
    const g = game.terrain.yAt(d.x);
    const sway = Math.sin(performance.now() * 0.005) * 0.08;
    ctx.save();
    ctx.translate(d.x, g);
    ctx.rotate(sway);
    ctx.globalAlpha = Math.min(1, d.timer * 2);
    line(0, 0, 0, -s(62), "#8a5a2b", sw(3));
    line(-s(24), -s(44), s(24), -s(44), "#8a5a2b", sw(3));
    // Patched shirt.
    ctx.fillStyle = rgbaFromHex(BLUE, 0.5);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = sw(1.5);
    ctx.beginPath();
    ctx.moveTo(-s(20), -s(46));
    ctx.lineTo(s(20), -s(46));
    ctx.lineTo(s(12), -s(18));
    ctx.lineTo(-s(12), -s(18));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Burlap head and straw hat.
    ctx.fillStyle = "#e8c66a";
    ctx.beginPath();
    ctx.arc(0, -s(56), s(9), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = LINE;
    ctx.fillRect(-s(4), -s(58), s(2), s(2));
    ctx.fillRect(s(2), -s(58), s(2), s(2));
    ctx.fillStyle = "#c98a3a";
    ctx.beginPath();
    ctx.ellipse(0, -s(63), s(15), s(3.5), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-s(7), -s(72), s(14), s(9));
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },

  // Frozen enemy eggs get a pale ring and a ticking clock tint over the field.
  drawTimeFreeze(game) {
    if (!(game.timeFreeze > 0)) return;
    ctx.save();
    ctx.fillStyle = "rgba(120,160,255,0.08)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(120,170,255,0.9)";
    ctx.lineWidth = 2;
    for (const e of game.eggs) {
      if (!e.frozenInAir) continue;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 1.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = LINE;
    ctx.font = "bold 22px Courier New";
    centerText(`TIME FREEZE ${game.timeFreeze.toFixed(1)}`, 175);
    ctx.restore();
  },

  // Blue-white flash when the Big Chill hits.
  drawChill(game) {
    if (!(game.chillFlash > 0)) return;
    ctx.fillStyle = `rgba(200,235,255,${(game.chillFlash * 0.6).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  },

  // Powers screen: pick which two powers sit in the W and E slots.
  drawScreen(game) {
    Menus.veil(0.92);
    const p = game.profile;
    const slots = this.loadout(p).map((a) => (a ? a.id : null));
    ctx.fillStyle = LINE;
    ctx.font = "bold 46px Courier New";
    centerText("POWERS", 86);
    ctx.font = "bold 16px Courier New";
    centerText("Equip two powers: press W or E in battle (or tap their buttons).", 114);
    const x0 = W / 2 - 390;
    ABILITIES.forEach((a, i) => {
      const y = 128 + i * POWER_ROW;
      const open = this.unlocked(p, a);
      ctx.save();
      if (!open) ctx.globalAlpha = 0.45;
      ctx.fillStyle = PAPER;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.fillRect(x0, y, 780, POWER_ROW - 4);
      ctx.strokeRect(x0, y, 780, POWER_ROW - 4);
      ctx.beginPath();
      ctx.arc(x0 + 34, y + 24, 19, 0, Math.PI * 2);
      ctx.stroke();
      this.drawIcon(a.id, x0 + 34, y + 24);
      ctx.fillStyle = LINE;
      ctx.font = "bold 20px Courier New";
      ctx.fillText(a.name, x0 + 68, y + 20);
      ctx.font = "bold 13px Courier New";
      ctx.fillText(a.desc, x0 + 68, y + 39);
      ctx.fillText(open ? `cooldown ${Math.round(a.cooldown * Armory.cooldownScale(p))}s` : `unlocks at LV ${a.level}`, x0 + 68 + ctx.measureText(a.name).width * 1.6 + 16, y + 20);
      ctx.restore();
      if (!open) return;
      POWER_SLOT_KEYS.forEach((key, slot) => {
        const b = Menus.button(key, x0 + 676 + slot * 56, y + 5, 46, () => this.setSlot(p, slot, a.id) || SaveManager.save(), 38);
        b.hot = slots[slot] === a.id;
      });
    });
    Menus.button("BACK", W / 2, 128 + ABILITIES.length * POWER_ROW + 8, 260, () => { game.scene = Menus.powersReturn; }).hot = true;
  },

  drawAirstrikes(game) {
    for (const strike of game.airstrikes) {
      drawPlaneShape(strike.x, strike.y, RIGHT, BLUE, 2.2);
    }
  },
};

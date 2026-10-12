"use strict";

// Player abilities with cooldowns (DESIGN.md section 8). The Yolk Drop is aimed by tapping the
// battlefield and keeps its own cooldown on the Game; the others fire from the ability bar or
// their hotkey. Quick Yolk in the Armory shortens every cooldown.

const ABILITIES = [
  {
    id: "airstrike",
    name: "Airstrike",
    key: "W",
    level: 7,
    cooldown: 22,
    desc: "A bomber sweeps over the enemy half dropping a line of eggs.",
  },
  {
    id: "shield",
    name: "Shield",
    key: "E",
    level: 12,
    cooldown: 32,
    desc: "Every unit in your army gains a shell shield that blocks one hit.",
  },
];

const AIRSTRIKE_SPEED = 420;
const AIRSTRIKE_DROPS = 9;

const Abilities = {
  reset(game) {
    game.abilityCooldowns = {};
    for (const a of ABILITIES) game.abilityCooldowns[a.id] = 0;
    game.airstrikes = [];
  },

  unlocked(profile, ability) {
    return profile.level >= ability.level;
  },

  update(game, dt) {
    for (const id of Object.keys(game.abilityCooldowns)) {
      game.abilityCooldowns[id] = Math.max(0, game.abilityCooldowns[id] - dt);
    }
    for (const strike of game.airstrikes) {
      strike.x += AIRSTRIKE_SPEED * dt;
      if (Math.random() < dt * 30) Effects.spawn("smoke", strike.x - 70, strike.y + 2, -30, -6, 0.5, 4, LINE);
      // Drop evenly spaced eggs while over the enemy half.
      while (strike.dropsLeft > 0 && strike.x >= strike.nextDropX) {
        game.eggs.push(new Egg(strike.x, strike.y + 16, AIRSTRIKE_SPEED * 0.25, 40, RIGHT, 2));
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
    if (!this.unlocked(game.profile, ability) || game.abilityCooldowns[id] > 0) {
      audio.play("deny");
      return false;
    }
    game.abilityCooldowns[id] = ability.cooldown * Armory.cooldownScale(game.profile);
    if (id === "airstrike") {
      const start = W * 0.42;
      const end = W - s(60);
      game.airstrikes.push({ x: -120, y: H * 0.24, nextDropX: start, spacing: (end - start) / (AIRSTRIKE_DROPS - 1), dropsLeft: AIRSTRIKE_DROPS });
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

  drawAirstrikes(game) {
    for (const strike of game.airstrikes) {
      drawPlaneShape(strike.x, strike.y, RIGHT, BLUE, 2.2);
    }
  },
};

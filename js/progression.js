"use strict";

// Progression formulas. Keep these in sync with DESIGN.md.
const Progression = {
  // DESIGN.md section 3: single difficulty factor for stage n.
  difficulty(stage) {
    return 1 + 0.45 * Math.log(1 + (Math.max(1, stage) - 1) / 4);
  },

  // DESIGN.md section 3: enemy multipliers derived from D(n).
  enemyHpScale(stage) {
    return 1 + settings.enemyHpScaleFromDifficulty * (this.difficulty(stage) - 1);
  },

  enemyFireScale(stage) {
    return 1 + settings.enemyFireScaleFromDifficulty * (this.difficulty(stage) - 1);
  },

  enemyBudget(stage) {
    return settings.enemyBaseBudget * (1 + settings.enemyBudgetScaleFromDifficulty * (this.difficulty(stage) - 1));
  },

  roundSeconds(stage) {
    const base = settings.roundBaseSeconds + settings.roundSecondsPerDifficulty * (this.difficulty(stage) - 1);
    return base + rand(-settings.roundJitterSeconds, settings.roundJitterSeconds);
  },

  // Picks enemy unit types from a point budget. Returns a map type -> count.
  buildArmy(budget, weights, caps) {
    const costs = settings.unitThreatPoints;
    const counts = {};
    const add = (type) => {
      counts[type] = (counts[type] || 0) + 1;
      budget -= costs[type];
    };
    // The enemy always fields its castle when it can afford one (as in the original game).
    if ((caps.castle || 0) > 0 && budget >= costs.castle) add("castle");
    for (;;) {
      const options = Object.keys(weights).filter((type) => costs[type] <= budget && (counts[type] || 0) < (caps[type] || 0));
      if (!options.length) break;
      const total = options.reduce((sum, type) => sum + weights[type], 0);
      let roll = Math.random() * total;
      let picked = options[options.length - 1];
      for (const type of options) {
        roll -= weights[type];
        if (roll <= 0) {
          picked = type;
          break;
        }
      }
      add(picked);
    }
    return counts;
  },

  // DESIGN.md section 7: XP needed to go from level L to L + 1.
  xpToNext(level) {
    return 60 + 30 * (Math.max(1, level) - 1);
  },

  // DESIGN.md section 6: base XP for a round at stage n (kills are added on top).
  roundXp(stage, won) {
    const base = 40 + 12 * Math.log(Math.max(1, stage));
    return Math.round(won ? base : base * 0.5);
  },

  // DESIGN.md section 6: Golden Eggs for a win at stage n.
  winGoldenEggs(stage) {
    return 2 + Math.floor(stage / 10);
  },

  // DESIGN.md section 6: every 2nd loss in a row grants 1 Golden Egg.
  lossGoldenEggs(lossStreak) {
    return lossStreak > 0 && lossStreak % 2 === 0 ? 1 : 0;
  },

  goldenEggsPerLevel: 3,

  // Adds XP to a profile ({ level, xp }) and returns the number of levels gained.
  addXp(profile, amount) {
    profile.xp += Math.max(0, Math.round(amount));
    let gained = 0;
    while (profile.xp >= this.xpToNext(profile.level)) {
      profile.xp -= this.xpToNext(profile.level);
      profile.level++;
      gained++;
    }
    return gained;
  },
};

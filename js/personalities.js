"use strict";

// Enemy personalities: army templates that change what the red army brings and how it moves.
// All personalities spend the same threat-point budget B(n) (scaled by `budgetScale` to pay for
// any stat bonus), so a personality changes the *kind* of fight, not its difficulty
// (DESIGN.md section 4).

const PERSONALITIES = {
  balanced: {
    id: "balanced",
    name: "BALANCED ARMY",
    tell: "A bit of everything.",
    weights: { soldier: 3, tank: 2, motorcycle: 1.5, drone: 1.5, airplane: 1, helicopter: 0.6, bomber: 0.5, medic: 0.5, mortar: 0.5, rider: 0.7 },
    budgetScale: 1,
    speedScale: 1,
    hpScale: 1,
  },
  rusher: {
    id: "rusher",
    name: "RUSHERS",
    tell: "Fast raiders charge straight at you - hold the line!",
    weights: { soldier: 3, motorcycle: 3.5, drone: 3, rider: 2.5, tank: 0.6, airplane: 0.4 },
    budgetScale: 0.95,
    speedScale: 1.3,
    hpScale: 1,
  },
  turtle: {
    id: "turtle",
    name: "TURTLE SHELL",
    tell: "Tough troops dig in and advance slowly - bring heavy eggs.",
    weights: { tank: 3.5, soldier: 2, medic: 2, mortar: 1, motorcycle: 0.5 },
    budgetScale: 0.88,
    speedScale: 0.55,
    hpScale: 1.15,
  },
  air: {
    id: "air",
    name: "AIR FORCE",
    tell: "The sky fills with planes - airplanes and helicopters shoot them down.",
    weights: { airplane: 3, helicopter: 2.5, bomber: 2, drone: 2.5, soldier: 1.5 },
    budgetScale: 1,
    speedScale: 1,
    hpScale: 1,
    minAirTypes: 1,
  },
  artillery: {
    id: "artillery",
    name: "ARTILLERY",
    tell: "Long-range guns stay back and shell you - rush them!",
    weights: { tank: 3, mortar: 2.5, soldier: 1.5, drone: 1 },
    budgetScale: 0.95,
    speedScale: 0.35,
    hpScale: 1,
    fireScale: 1.1,
  },
};

// Stages 1-2 are always Balanced; after that the template rotates so consecutive stages differ.
const PERSONALITY_CYCLE = ["rusher", "balanced", "turtle", "artillery", "air"];

const Personalities = {
  forStage(stage) {
    if (stage <= 2) return PERSONALITIES.balanced;
    const p = PERSONALITIES[PERSONALITY_CYCLE[(stage - 3) % PERSONALITY_CYCLE.length]];
    // An Air Force needs at least one allowed aircraft type, otherwise fall back to Balanced.
    if (p.minAirTypes && !["airplane", "helicopter", "bomber"].some((t) => Unlocks.enemyTypeAllowed(t, stage))) return PERSONALITIES.balanced;
    return p;
  },

  weightsFor(personality, stage) {
    const weights = {};
    for (const [type, weight] of Object.entries(personality.weights)) {
      if (Unlocks.enemyTypeAllowed(type, stage)) weights[type] = weight;
    }
    // Always keep some infantry so the budget can be spent.
    if (!Object.keys(weights).length) weights.soldier = 1;
    return weights;
  },

  // Applied to freshly spawned enemy units, after stage scaling.
  apply(personality, units) {
    for (const u of units) {
      u.speed *= personality.speedScale;
      if (personality.hpScale !== 1) u.hp = Math.ceil(u.hp * personality.hpScale);
      if (personality.fireScale) u.fireRate *= personality.fireScale;
    }
  },
};

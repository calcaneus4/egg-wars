"use strict";

// Stage kit (ROADMAP section 15): to keep the screen calm, each stage offers only a few of the
// things the player has unlocked, picked at random (seeded by the stage, so a replay offers the
// same kit). Something unlocked but not yet offered is always included first.
//   units  soldier and tank, plus up to KIT_EXTRA_UNITS other unlocked units (max 6 cards)
//   eggs   Classic, plus up to KIT_EXTRA_EGGS other unlocked Yolk Drop eggs (max 3 chips)
// While fewer than 6 units are unlocked, the next locked unit is shown as a teaser card.

const KIT_CORE_UNITS = ["soldier", "tank"];
const KIT_EXTRA_UNITS = 4;
const KIT_EXTRA_EGGS = 2;

const Kit = {
  units: [...KIT_CORE_UNITS],

  flags() {
    const flags = SaveManager.data.flags;
    if (!flags.offered || typeof flags.offered !== "object") flags.offered = {};
    return flags;
  },

  // Fresh unlocks first (in unlock order), then a seeded shuffle of the rest.
  pick(pool, count, random, key) {
    const offered = this.flags().offered;
    const fresh = pool.filter((id) => !offered[`${key}:${id}`]);
    const rest = pool.filter((id) => offered[`${key}:${id}`]);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return fresh.concat(rest).slice(0, count);
  },

  build(game) {
    const p = game.profile;
    const random = seededRandom(game.stage * 7877 + 3);
    const unlocked = SHOP_ORDER.filter((t) => !KIT_CORE_UNITS.includes(t) && Unlocks.unitUnlocked(p, t));
    const extras = this.pick(unlocked, KIT_EXTRA_UNITS, random, "unit");
    // Against an Air Force, always offer something that can shoot planes down.
    const antiAir = ["airplane", "helicopter"].filter((t) => unlocked.includes(t));
    if (game.personality && game.personality.id === "air" && antiAir.length && !extras.some((t) => antiAir.includes(t))) {
      extras[Math.min(extras.length, KIT_EXTRA_UNITS - 1)] = antiAir[0];
    }
    if (extras.length < KIT_EXTRA_UNITS) {
      const next = SHOP_ORDER.filter((t) => !Unlocks.unitUnlocked(p, t)).sort((a, b) => Unlocks.unitUnlockLevel(a) - Unlocks.unitUnlockLevel(b))[0];
      if (next) extras.push(next);
    }
    this.units = SHOP_ORDER.filter((t) => KIT_CORE_UNITS.includes(t) || extras.includes(t));
    const eggPool = Object.values(EGG_TYPES).filter((t) => t.yolkDrop && t.id !== "normal" && p.level >= t.level).map((t) => t.id);
    EggTypes.kit = ["normal", ...this.pick(eggPool, KIT_EXTRA_EGGS, random, "egg")];
    if (game.scene === "battle") {
      const offered = this.flags().offered;
      for (const t of this.units) if (Unlocks.unitUnlocked(p, t)) offered[`unit:${t}`] = true;
      for (const id of EggTypes.kit) offered[`egg:${id}`] = true;
    }
  },
};

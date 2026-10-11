"use strict";

// Armory: permanent upgrades bought with Golden Eggs (DESIGN.md section 5).
// Level k of a track costs (1 + k) Golden Eggs to buy the next level; every track caps at 20.

const ARMORY_MAX_LEVEL = 20;
const ARMORY_UNLOCK_LEVEL = 2;

const ARMORY_TRACKS = [
  {
    id: "hp",
    name: "Thick Shells",
    desc: "Your units get more HP",
    effect: (k) => `x${(1 + 0.08 * k).toFixed(2)} HP`,
  },
  {
    id: "rate",
    name: "Rapid Lobbing",
    desc: "Your units fire faster",
    effect: (k) => `x${(1 + 0.05 * k).toFixed(2)} fire rate`,
  },
  {
    id: "dmg",
    name: "Hard-Boiled Eggs",
    desc: "Chance for a hit to deal double damage",
    effect: (k) => `${Math.round(Armory.doubleHitChance(k) * 100)}% double hits`,
  },
  {
    id: "chest",
    name: "War Chest",
    desc: "More gold from every round",
    effect: (k) => `x${(1 + 0.1 * k).toFixed(1)} round gold`,
  },
  {
    id: "yolk",
    name: "Quick Yolk",
    desc: "Yolk Drop recharges faster",
    effect: (k) => `${(settings.powerUpCooldown / (1 + 0.06 * k)).toFixed(1)}s cooldown`,
  },
  {
    id: "bulk",
    name: "Bulk Orders",
    desc: "Reinforcements cost less",
    effect: (k) => `-${Math.round((1 - 1 / (1 + 0.04 * k)) * 100)}% prices`,
  },
];

const Armory = {
  level(profile, id) {
    return (profile.armory && profile.armory[id]) || 0;
  },

  nextCost(profile, id) {
    const k = this.level(profile, id);
    return k >= ARMORY_MAX_LEVEL ? Infinity : 1 + k;
  },

  isOpen(profile) {
    return profile.level >= ARMORY_UNLOCK_LEVEL;
  },

  buy(profile, id) {
    const cost = this.nextCost(profile, id);
    if (!this.isOpen(profile) || profile.goldenEggs < cost) return false;
    profile.goldenEggs -= cost;
    profile.armory[id] = this.level(profile, id) + 1;
    return true;
  },

  doubleHitChance(k) {
    return Math.min(0.8, 0.04 * k);
  },

  hpScale(profile) {
    return 1 + 0.08 * this.level(profile, "hp");
  },

  fireScale(profile) {
    return 1 + 0.05 * this.level(profile, "rate");
  },

  goldScale(profile) {
    return 1 + 0.1 * this.level(profile, "chest");
  },

  yolkCooldown(profile) {
    return settings.powerUpCooldown / (1 + 0.06 * this.level(profile, "yolk"));
  },

  unitCost(profile, type) {
    const base = settings.unitSpawnCosts[type] || 0;
    return Math.max(1, Math.round(base / (1 + 0.04 * this.level(profile, "bulk"))));
  },

  // Applies HP and fire-rate upgrades once to a freshly created player unit.
  upgradeUnit(profile, unit) {
    if (unit.armoryApplied) return;
    unit.armoryApplied = true;
    unit.hp = Math.ceil(unit.hp * this.hpScale(profile));
    unit.fireRate *= this.fireScale(profile);
  },
};

// Armory screen, drawn by Menus when game.scene === "armory".
function drawArmoryScreen(game) {
  const p = game.profile;
  Menus.veil(0.93);
  ctx.fillStyle = LINE;
  ctx.font = "bold 44px Courier New";
  centerText("ARMORY", 92);
  ctx.font = "bold 20px Courier New";
  const geText = `Golden Eggs: ${p.goldenEggs}`;
  const geW = ctx.measureText(geText).width;
  game.drawGoldenEggIcon(W / 2 - geW / 2 - 14, 118, 9);
  ctx.fillStyle = LINE;
  ctx.font = "bold 20px Courier New";
  centerText(geText, 125);

  if (!Armory.isOpen(p)) {
    ctx.font = "bold 24px Courier New";
    centerText(`The Armory opens at level ${ARMORY_UNLOCK_LEVEL}. Keep battling!`, 300);
  } else {
    const left = 90;
    let y = 150;
    for (const track of ARMORY_TRACKS) {
      const k = Armory.level(p, track.id);
      const cost = Armory.nextCost(p, track.id);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(left, y, W - left * 2, 62);
      ctx.fillStyle = LINE;
      ctx.font = "bold 22px Courier New";
      ctx.fillText(track.name, left + 14, y + 26);
      ctx.font = "bold 15px Courier New";
      ctx.fillText(track.desc, left + 14, y + 49);
      // Level pips.
      for (let i = 0; i < ARMORY_MAX_LEVEL; i++) {
        const px = left + 380 + i * 13;
        ctx.strokeStyle = LINE;
        ctx.strokeRect(px, y + 14, 9, 14);
        if (i < k) {
          ctx.fillStyle = YOLK;
          ctx.fillRect(px + 1, y + 15, 7, 12);
        }
      }
      ctx.fillStyle = LINE;
      ctx.font = "bold 16px Courier New";
      ctx.fillText(`LV ${k}  ${track.effect(k)}`, left + 380, y + 49);
      const maxed = cost === Infinity;
      const btn = Menus.button(maxed ? "MAX" : `BUY ${cost} GE`, W - left - 90, y + 9, 150, () => {
        if (Armory.buy(p, track.id)) {
          SaveManager.save();
          audio.play("fire");
        }
      }, 44);
      btn.hot = !maxed && p.goldenEggs >= cost;
      btn.disabled = maxed || p.goldenEggs < cost;
      y += 70;
    }
  }
  Menus.button("BACK", W / 2, H - 60, 260, () => { game.scene = Menus.armoryReturn; }).hot = true;
}

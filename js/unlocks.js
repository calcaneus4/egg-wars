"use strict";

// Level-based unlock schedule (DESIGN.md section 8). Only content that exists in the game is
// listed; new features add their entry here when they land.
//   kind "unit"    - a unit type the player can field and buy (`type` is the unitType name)
//   kind "special" - a named special unit that joins every battle (`name` matches the legacy save names)
//   kind "feature" - a menu or ability
const UNLOCKS = [
  { level: 1, kind: "unit", type: "soldier", name: "Soldier", desc: "Cheap egg-lobbing infantry" },
  { level: 1, kind: "unit", type: "tank", name: "Tank", desc: "Tough armour with long-range eggs" },
  { level: 1, kind: "unit", type: "motorcycle", name: "Motorcycle", desc: "Fast raider with a gunner" },
  { level: 1, kind: "unit", type: "drone", name: "Drone", desc: "Kamikaze egg drone" },
  { level: 1, kind: "feature", id: "yolkDrop", name: "Yolk Drop", desc: "Tap the battlefield to drop a yolk bomb" },
  { level: 2, kind: "unit", type: "airplane", name: "Airplane", desc: "Fast bomber of the skies" },
  { level: 2, kind: "feature", id: "armory", name: "Armory", desc: "Spend Golden Eggs on permanent upgrades" },
  { level: 3, kind: "special", name: "Mega Knight", desc: "A giant tank joins every battle" },
  { level: 4, kind: "feature", id: "reinforce", name: "Reinforcements", desc: "Power: 4 soldiers parachute in beside your castle" },
  { level: 4, kind: "feature", id: "cluster", name: "Cluster Egg", desc: "Yolk Drop option: splits into 6 eggs mid-air (press Q)" },
  { level: 5, kind: "unit", type: "helicopter", name: "Helicopter", desc: "Hovers over enemies and drops eggs" },
  { level: 5, kind: "special", name: "Fire Wizard", desc: "A rapid-fire soldier joins every battle" },
  { level: 6, kind: "unit", type: "catapult", name: "Catapult Wagon", desc: "Siege cart that hangs back and lobs huge bursting eggs" },
  { level: 6, kind: "unit", type: "medic", name: "Egg Medic", desc: "Heals the most hurt ally nearby" },
  { level: 7, kind: "feature", id: "bouncing", name: "Bouncer Egg", desc: "Yolk Drop option: hops toward the enemy, bursting on each bounce" },
  { level: 7, kind: "feature", id: "airstrike", name: "Airstrike", desc: "Power: a bomber drops a line of eggs on the enemy" },
  { level: 8, kind: "unit", type: "roller", name: "Rolling-Pin Roller", desc: "Slow roller that shoves the enemy front line back" },
  { level: 8, kind: "unit", type: "bomber", name: "Bomber", desc: "Heavy aircraft with egg bursts" },
  { level: 8, kind: "special", name: "Yolk Bomber", desc: "A super bomber joins every battle" },
  { level: 9, kind: "feature", id: "goose", name: "Golden Goose", desc: "Power: a goose lays gold coins for 8 s" },
  { level: 9, kind: "feature", id: "frost", name: "Frost Egg", desc: "Yolk Drop option: freezes enemies solid for a moment" },
  { level: 10, kind: "unit", type: "castle", name: "Castle", desc: "Buy extra catapult towers" },
  { level: 10, kind: "feature", id: "sticky", name: "Sticky Egg", desc: "Yolk Drop option: glues enemies so they slow right down" },
  { level: 11, kind: "feature", id: "popcorn", name: "Popcorn Egg", desc: "Yolk Drop option: pops three times, spraying hot kernels" },
  { level: 11, kind: "unit", type: "truck", name: "Monster Truck", desc: "Frying-pan bruiser that drives right over infantry" },
  { level: 11, kind: "unit", type: "mortar", name: "Mortar Hen", desc: "Slow hen that lobs bursting eggs across the field" },
  { level: 10, kind: "feature", id: "rooster", name: "Rooster Rally", desc: "Power: your army moves and fires 40% faster for 6 s" },
  { level: 12, kind: "unit", type: "hover", name: "Hover Coop", desc: "Fast hovercraft that floats over hazards, mud and goo" },
  { level: 12, kind: "feature", id: "shield", name: "Shell Shield", desc: "Power: every unit gains a one-hit shield (pick powers on the Powers screen)" },
  { level: 17, kind: "feature", id: "chill", name: "Big Chill", desc: "Power: freezes every enemy solid for 2.5 s" },
  { level: 13, kind: "unit", type: "balloon", name: "Chick Balloon", desc: "Floats over the enemy and drops chick paratroopers" },
  { level: 13, kind: "feature", id: "smoke", name: "Smoke Egg", desc: "Yolk Drop option: a smoke cloud that spoils the enemy's aim" },
  { level: 14, kind: "feature", id: "scarecrow", name: "Scarecrow", desc: "Power: a scarecrow draws the enemy's fire for 6 s" },
  { level: 14, kind: "feature", id: "explosive", name: "Boomer Egg", desc: "Yolk Drop option: big blast that digs craters" },
  { level: 15, kind: "feature", id: "zapper", name: "Zapper Egg", desc: "Yolk Drop option: chain lightning through up to 4 enemies" },
  { level: 16, kind: "feature", id: "magnet", name: "Magnet Egg", desc: "Yolk Drop option: pulls enemy troops into a clump" },
  { level: 16, kind: "unit", type: "rider", name: "Rooster Rider", desc: "Fast cavalry that charges in and pecks up close" },
  { level: 18, kind: "feature", id: "homing", name: "Seeker Egg", desc: "Yolk Drop option: four eggs that hunt enemies, aircraft first" },
];

// Unit types that every army always gets for free, whatever is unlocked (the home castle).
const ALWAYS_FIELDED = ["castle"];

const Unlocks = {
  isUnlocked(profile, entry) {
    if (entry.kind === "special" && profile.unlockedNames.includes(entry.name)) return true;
    return profile.level >= entry.level;
  },

  unitUnlockLevel(type) {
    const entry = UNLOCKS.find((u) => u.kind === "unit" && u.type === type);
    return entry ? entry.level : 1;
  },

  unitUnlocked(profile, type) {
    return profile.level >= this.unitUnlockLevel(type);
  },

  specialUnlocked(profile, name) {
    const entry = UNLOCKS.find((u) => u.kind === "special" && u.name === name);
    return entry ? this.isUnlocked(profile, entry) : profile.unlockedNames.includes(name);
  },

  // Entries that became available when going from level `from` to level `to`.
  between(profile, from, to) {
    return UNLOCKS.filter((u) => u.level > from && u.level <= to && !(u.kind === "special" && profile.unlockedNames.includes(u.name)));
  },

  // The next locked entries (all at the same level), or [] when everything is unlocked.
  next(profile) {
    const locked = UNLOCKS.filter((u) => !this.isUnlocked(profile, u));
    if (!locked.length) return [];
    const level = Math.min(...locked.map((u) => u.level));
    return locked.filter((u) => u.level === level);
  },

  nextText(profile) {
    const next = this.next(profile);
    if (!next.length) return "";
    return `NEXT AT LV ${next[0].level}: ${next.map((u) => u.name).join(", ")}`;
  },

  // Enemy may field a unit type from this stage on, roughly when a typical player unlocks it
  // (player level is about stage / 2, see DESIGN.md section 8).
  enemyTypeAllowed(type, stage) {
    if (ALWAYS_FIELDED.includes(type)) return true;
    return stage >= 2 * this.unitUnlockLevel(type) - 1;
  },
};

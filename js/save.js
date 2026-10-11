"use strict";

// Persistent save data in localStorage. See DESIGN.md section 11.
// Every storage access is wrapped so the game still runs when storage is unavailable.

const SAVE_KEY = "eggwars.save";
const SAVE_CORRUPT_KEY = "eggwars.save.corrupt";
const SAVE_VERSION = 1;

function defaultSave() {
  return {
    version: SAVE_VERSION,
    profile: {
      gold: 0,
      stage: 1,
      unlockedNames: [],
      level: 1,
      xp: 0,
      goldenEggs: 0,
      lossStreak: 0,
    },
    settings: {},
    stats: {
      wins: 0,
      losses: 0,
      roundsPlayed: 0,
      kills: 0,
    },
    flags: {},
  };
}

// Each entry upgrades a save from version `from` to `from + 1`.
// Add a step here whenever the format changes; never edit an old step.
const SAVE_MIGRATIONS = {
  // 0 -> 1: version-less blobs (none shipped yet) are treated as v1 data.
  0: (data) => ({ ...data, version: 1 }),
};

// Fill any missing keys from defaults, keeping existing values. Arrays and primitives are taken as-is.
function mergeDefaults(defaults, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return defaults;
  const out = { ...data };
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in out)) out[key] = value;
    else if (value && typeof value === "object" && !Array.isArray(value)) out[key] = mergeDefaults(value, out[key]);
  }
  return out;
}

function migrateSave(data) {
  let version = Number.isInteger(data.version) ? data.version : 0;
  while (version < SAVE_VERSION) {
    const step = SAVE_MIGRATIONS[version];
    if (!step) throw new Error(`No save migration from version ${version}`);
    data = step(data);
    version = data.version;
  }
  return data;
}

function validateSave(data) {
  const p = data.profile;
  p.gold = Number.isFinite(p.gold) ? Math.max(0, Math.floor(p.gold)) : 0;
  p.stage = Number.isFinite(p.stage) ? Math.max(1, Math.floor(p.stage)) : 1;
  p.level = Number.isFinite(p.level) ? Math.max(1, Math.floor(p.level)) : 1;
  p.xp = Number.isFinite(p.xp) ? Math.max(0, Math.floor(p.xp)) : 0;
  p.goldenEggs = Number.isFinite(p.goldenEggs) ? Math.max(0, Math.floor(p.goldenEggs)) : 0;
  p.lossStreak = Number.isFinite(p.lossStreak) ? Math.max(0, Math.floor(p.lossStreak)) : 0;
  p.unlockedNames = Array.isArray(p.unlockedNames) ? p.unlockedNames.filter((n) => typeof n === "string") : [];
  for (const key of Object.keys(data.stats)) {
    if (!Number.isFinite(data.stats[key])) data.stats[key] = 0;
  }
  return data;
}

const SaveManager = {
  data: defaultSave(),
  available: false,

  load() {
    let raw = null;
    try {
      raw = window.localStorage.getItem(SAVE_KEY);
      this.available = true;
    } catch (err) {
      this.available = false;
    }
    if (!raw) {
      this.data = defaultSave();
      return this.data;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("Save is not an object");
      this.data = validateSave(mergeDefaults(defaultSave(), migrateSave(parsed)));
    } catch (err) {
      try {
        window.localStorage.setItem(SAVE_CORRUPT_KEY, raw);
      } catch (ignored) {
        // Nothing more we can do.
      }
      this.data = defaultSave();
    }
    return this.data;
  },

  save() {
    if (!this.available) return false;
    try {
      this.data.version = SAVE_VERSION;
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      return true;
    } catch (err) {
      return false;
    }
  },

  reset() {
    this.data = defaultSave();
    this.save();
    return this.data;
  },
};

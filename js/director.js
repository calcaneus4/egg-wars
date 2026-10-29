"use strict";

// Variety Director (DESIGN.md section 12). Decides each stage's extras so new content shows up
// often enough to surprise, but never all at once: at most one surprise event per stage, at most
// one brand-new thing (a "debut") per stage, and no event twice in a row.

const DIRECTOR_FIRST_EVENT_STAGE = 4;

const Director = {
  plan: null,

  flags() {
    const flags = SaveManager.data.flags;
    if (!flags.seen || typeof flags.seen !== "object") flags.seen = {};
    return flags;
  },

  seen(key) {
    return !!this.flags().seen[key];
  },

  markSeen(key) {
    this.flags().seen[key] = true;
  },

  eventChance(stage, boss) {
    if (stage < DIRECTOR_FIRST_EVENT_STAGE) return 0;
    const p = Math.min(0.45, 0.12 + 0.03 * (stage - DIRECTOR_FIRST_EVENT_STAGE));
    return boss ? p / 2 : p;
  },

  // Called from Game.startStage after weather and the armies are set up.
  planStage(game) {
    const random = seededRandom(game.stage * 6151 + 29);
    const flags = this.flags();
    const plan = { event: null, eventAt: 0 };
    this.plan = plan;
    if (Tutorial.active()) return plan;
    const weatherDebut = Weather.type !== "clear" && !this.seen(`weather:${Weather.type}`);
    if (random() >= this.eventChance(game.stage, game.bossStage)) return plan;
    let pool = Object.values(EVENT_TYPES).filter((e) => game.stage >= e.minStage && e.id !== flags.lastEvent && (!e.allowed || e.allowed(game)));
    // Only one debut per stage: if the weather is new, pick from events already seen.
    if (weatherDebut) pool = pool.filter((e) => this.seen(`event:${e.id}`));
    if (!pool.length) return plan;
    // Some events feel at home in certain biomes (frogs in the swamp...) and come up more there.
    const night = Sky.phase === "night" || Sky.phase === "dusk";
    const weight = (e) => e.weight * ((e.biomes && game.biome && e.biomes[game.biome.id]) || 1) * (night && e.nightWeight ? e.nightWeight : 1);
    const total = pool.reduce((sum, e) => sum + weight(e), 0);
    let roll = random() * total;
    const pick = pool.find((e) => (roll -= weight(e)) <= 0) || pool[0];
    plan.event = pick.id;
    // Timing is re-rolled on replays so a retry doesn't play out identically.
    plan.eventAt = game.roundLimit * rand(0.25, 0.7);
    return plan;
  },

  // Remembers what the player has now met, for debut limits and tips.
  noteStart(game) {
    if (Weather.type === "clear") return;
    this.markSeen(`weather:${Weather.type}`);
    const info = Weather.info();
    if (info.tip) Tutorial.queueTip(`weather:${Weather.type}`, info.tip);
  },
};

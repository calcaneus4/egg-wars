// Egg Wars service worker: keeps a copy of every game file on the device so the game opens and
// plays with no connection, and lets phones install it to the home screen.
// VERSION and FILES are filled in by tools/update-sw.js; a new VERSION makes devices fetch the update.
"use strict";

const VERSION = "ecc5c88d00af";
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "js/config.js",
  "js/util.js",
  "js/save.js",
  "js/progression.js",
  "js/audio.js",
  "js/music.js",
  "js/biomes.js",
  "js/background.js",
  "js/sky.js",
  "js/weather.js",
  "js/terrain.js",
  "js/effects.js",
  "js/draw.js",
  "js/units.js",
  "js/vehicles.js",
  "js/eggtypes.js",
  "js/projectiles.js",
  "js/bosses.js",
  "js/unlocks.js",
  "js/personalities.js",
  "js/armory.js",
  "js/abilities.js",
  "js/hazards.js",
  "js/director.js",
  "js/events.js",
  "js/critters.js",
  "js/monsters.js",
  "js/oddities.js",
  "js/afflictions.js",
  "js/detours.js",
  "js/visitors.js",
  "js/reinforcements.js",
  "js/kit.js",
  "js/objectives.js",
  "js/achievements.js",
  "js/tutorial.js",
  "js/worldmap.js",
  "js/menus.js",
  "js/hud.js",
  "js/results.js",
  "js/stats.js",
  "js/game.js",
  "js/main.js",
  "icons/apple-touch-icon.png",
  "icons/favicon-64.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
];
const CACHE = `egg-wars-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  // Remove copies of older versions.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("egg-wars-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Saved copy first (instant and offline); fall back to the network for anything not saved.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).catch(() => (req.mode === "navigate" ? caches.match("index.html") : undefined))),
  );
});

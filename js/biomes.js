"use strict";

// Biomes: each run of five stages takes place in a different land with its own terrain shape,
// ground colour, background decorations and weather. After Candy Mountains the cycle repeats.

const BIOME_STAGES = 5;

const BIOMES = [
  {
    id: "meadow",
    name: "Meadow",
    terrain: { minY: 0.64, maxY: 0.86, rough: 100, smooth: 5 },
    ground: null,
    grass: true,
    decor: "trees",
    weather: { clear: 5, rain: 2, snow: 0.5, windy: 1.5, fog: 1, storm: 1.2, hail: 0.6 },
  },
  {
    id: "desert",
    name: "Desert Dunes",
    terrain: { minY: 0.66, maxY: 0.84, rough: 70, smooth: 8 },
    ground: [235, 190, 110, 0.32],
    grass: false,
    stipple: true,
    decor: "cacti",
    weather: { clear: 6, windy: 3, heat: 2.5, storm: 0.4 },
  },
  {
    id: "snow",
    name: "Snowfield",
    terrain: { minY: 0.62, maxY: 0.86, rough: 110, smooth: 4 },
    ground: [210, 230, 255, 0.35],
    grass: false,
    snowCap: true,
    decor: "pines",
    weather: { snow: 5, clear: 2, windy: 2, fog: 1.5, hail: 1.5 },
  },
  {
    id: "volcano",
    name: "Volcano",
    terrain: { minY: 0.6, maxY: 0.88, rough: 130, smooth: 3 },
    ground: [70, 45, 40, 0.28],
    grass: false,
    cracks: true,
    decor: "rocks",
    weather: { clear: 4, windy: 2, heat: 2, storm: 1, fog: 0.8 },
  },
  {
    id: "kitchen",
    name: "Kitchen Counter",
    terrain: { minY: 0.7, maxY: 0.8, rough: 40, smooth: 9 },
    ground: [255, 255, 255, 0.0],
    grass: false,
    tiles: true,
    decor: "kitchen",
    weather: { clear: 3, fog: 1, heat: 1.5 },
  },
  {
    id: "swamp",
    name: "Soggy Swamp",
    terrain: { minY: 0.7, maxY: 0.84, rough: 60, smooth: 7 },
    ground: [80, 105, 55, 0.3],
    grass: false,
    reeds: true,
    decor: "willows",
    weather: { clear: 2, rain: 2, fog: 2.5, storm: 1 },
  },
  {
    id: "candy",
    name: "Candy Mountains",
    terrain: { minY: 0.6, maxY: 0.86, rough: 120, smooth: 4 },
    ground: [255, 160, 195, 0.3],
    grass: false,
    candy: true,
    decor: "candy",
    weather: { clear: 4, windy: 1.5, heat: 1, hail: 0.5 },
  },
];

const Biomes = {
  forStage(stage) {
    return BIOMES[Math.floor((Math.max(1, stage) - 1) / BIOME_STAGES) % BIOMES.length];
  },

  rgba(c, alphaScale = 1) {
    return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] * alphaScale).toFixed(3)})`;
  },
};

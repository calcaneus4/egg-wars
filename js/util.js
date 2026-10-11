"use strict";

const s = (v) => v * settings.scale;
const sw = (v = 2) => Math.max(settings.unitLine, Math.round(s(v)));
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
const speechCooldown = (a, b) => settings.speechBubbleFrequency <= 0 ? Infinity : rand(a, b) / Math.max(0.01, settings.speechBubbleFrequency);
const choice = (items) => items[Math.floor(Math.random() * items.length)];

function teamColor(side) {
  return side === RIGHT ? BLUE : RED;
}

function hexToRgb(hex) {
  const normalized = String(hex).replace("#", "");
  if (normalized.length !== 6) return [250, 250, 248];
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbaFromHex(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

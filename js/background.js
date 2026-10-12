"use strict";

// Layered parallax background: sketchy mountains, hills and a sun, drawn in code.
// Each layer is a seamless strip twice the screen width, pre-rendered to an offscreen canvas
// whenever the stage or color scheme changes, then scrolled slowly at its own speed.

const BACKGROUND_LAYERS = [
  // far -> near
  { kind: "mountains", base: 0.5, amp: 0.13, speed: 2, fill: 0.06, stroke: 0.22, detail: 7 },
  { kind: "hills", base: 0.6, amp: 0.07, speed: 5, fill: 0.07, stroke: 0.3, detail: 5 },
  { kind: "trees", base: 0.67, amp: 0.045, speed: 9, fill: 0.08, stroke: 0.38, detail: 4 },
];

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

class Background {
  constructor() {
    this.layers = [];
    this.seed = 1;
    this.renderedKey = "";
    this.time = 0;
  }

  regenerate(biome = BIOMES[0], seed = Math.floor(Math.random() * 1e9)) {
    this.biome = biome;
    this.seed = seed;
    this.renderedKey = "";
  }

  update(dt) {
    this.time += dt;
  }

  // Height of a seamless ridge at x in [0, 2W): a sum of sines whose periods divide 2W.
  ridge(random, layer) {
    const span = W * 2;
    const waves = [];
    for (let i = 0; i < layer.detail; i++) {
      waves.push({ k: 1 + Math.floor(random() * (3 + i * 3)), a: (random() * 0.6 + 0.4) / (i + 1), p: random() * Math.PI * 2 });
    }
    const total = waves.reduce((sum, w) => sum + w.a, 0);
    const points = [];
    for (let x = 0; x <= span; x += 6) {
      let v = 0;
      for (const w of waves) {
        const sv = Math.sin((x / span) * Math.PI * 2 * w.k + w.p);
        v += w.a * (layer.kind === "mountains" ? 1 - Math.abs(sv) * 2 : sv);
      }
      points.push([x, H * layer.base - (v / total) * H * layer.amp]);
    }
    return points;
  }

  renderLayer(layer, index) {
    const random = seededRandom(this.seed * 31 + index * 977);
    const off = document.createElement("canvas");
    off.width = W * 2;
    off.height = H;
    const g = off.getContext("2d");
    const pts = this.ridge(random, layer);
    // Fill.
    const top = H * (layer.base - layer.amp);
    const grad = g.createLinearGradient(0, top, 0, H * (layer.base + 0.18));
    grad.addColorStop(0, rgbaFromHex(LINE, layer.fill));
    grad.addColorStop(1, rgbaFromHex(LINE, 0));
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, H);
    pts.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(W * 2, H);
    g.closePath();
    g.fill();
    // Two slightly offset strokes give a hand-inked look.
    g.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
      g.strokeStyle = rgbaFromHex(LINE, layer.stroke * (pass ? 0.5 : 1));
      g.lineWidth = pass ? 1 : 2;
      g.beginPath();
      pts.forEach(([x, y], i) => {
        const jy = y + (pass ? (random() - 0.5) * 3 : 0);
        if (i) g.lineTo(x, jy);
        else g.moveTo(x, jy);
      });
      g.stroke();
    }
    // Details: snow caps on mountains, hatching on hills, little trees on the near layer.
    g.strokeStyle = rgbaFromHex(LINE, layer.stroke * 0.8);
    g.lineWidth = 1.5;
    for (let i = 4; i < pts.length - 4; i++) {
      const [x, y] = pts[i];
      if (layer.kind === "mountains" && pts[i - 1][1] > y && pts[i + 1][1] >= y && y < H * (layer.base - layer.amp * 0.3)) {
        g.beginPath();
        g.moveTo(x - 14, y + 12);
        g.lineTo(x - 6, y + 7);
        g.lineTo(x, y + 13);
        g.lineTo(x + 7, y + 7);
        g.lineTo(x + 15, y + 12);
        g.stroke();
      }
      if (layer.kind === "hills" && random() < 0.12) {
        g.beginPath();
        g.moveTo(x, y + 8 + random() * 10);
        g.lineTo(x + 6, y + 16 + random() * 14);
        g.stroke();
      }
      if (layer.kind === "trees" && this.biome && this.biome.decor !== "trees") {
        if (random() < 0.12) this.drawDecor(g, this.biome.decor, x, y, 10 + random() * 16, random, layer);
        continue;
      }
      if (layer.kind === "trees" && random() < 0.16) {
        const h = 10 + random() * 14;
        g.beginPath();
        g.moveTo(x, y + 2);
        g.lineTo(x, y - h * 0.4);
        g.stroke();
        g.beginPath();
        if (random() < 0.5) {
          g.moveTo(x - h * 0.35, y - h * 0.3);
          g.lineTo(x, y - h);
          g.lineTo(x + h * 0.35, y - h * 0.3);
          g.closePath();
        } else {
          g.arc(x, y - h * 0.65, h * 0.35, 0, Math.PI * 2);
        }
        g.fillStyle = rgbaFromHex(LINE, layer.fill * 1.3);
        g.fill();
        g.stroke();
      }
    }
    return off;
  }

  // Near-layer silhouettes for non-meadow biomes.
  drawDecor(g, kind, x, y, h, random, layer) {
    g.fillStyle = rgbaFromHex(LINE, layer.fill * 1.3);
    g.beginPath();
    if (kind === "cacti") {
      g.moveTo(x, y + 2);
      g.lineTo(x, y - h);
      g.moveTo(x, y - h * 0.5);
      g.lineTo(x - h * 0.3, y - h * 0.55);
      g.lineTo(x - h * 0.3, y - h * 0.8);
      g.moveTo(x, y - h * 0.65);
      g.lineTo(x + h * 0.3, y - h * 0.7);
      g.lineTo(x + h * 0.3, y - h * 0.95);
      g.lineWidth = 3;
      g.stroke();
      g.lineWidth = 1.5;
    } else if (kind === "pines") {
      for (let k = 0; k < 3; k++) {
        const ty = y - h * (0.3 + k * 0.3);
        g.moveTo(x - h * (0.4 - k * 0.1), ty + h * 0.2);
        g.lineTo(x, ty - h * 0.15);
        g.lineTo(x + h * (0.4 - k * 0.1), ty + h * 0.2);
      }
      g.fill();
      g.stroke();
    } else if (kind === "rocks") {
      g.moveTo(x - h * 0.6, y + 2);
      g.lineTo(x - h * 0.3, y - h * 0.5);
      g.lineTo(x + h * 0.1, y - h * 0.7);
      g.lineTo(x + h * 0.5, y - h * 0.2);
      g.lineTo(x + h * 0.6, y + 2);
      g.closePath();
      g.fill();
      g.stroke();
    } else if (kind === "kitchen") {
      // Jars, bottles and a pepper mill on the back counter.
      const pick = Math.floor(random() * 3);
      if (pick === 0) g.rect(x - h * 0.3, y - h, h * 0.6, h);
      else if (pick === 1) {
        g.moveTo(x - h * 0.2, y);
        g.lineTo(x - h * 0.2, y - h * 0.8);
        g.lineTo(x - h * 0.08, y - h * 1.3);
        g.lineTo(x + h * 0.08, y - h * 1.3);
        g.lineTo(x + h * 0.2, y - h * 0.8);
        g.lineTo(x + h * 0.2, y);
      } else g.ellipse(x, y - h * 0.5, h * 0.25, h * 0.6, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }

  ensureRendered() {
    const key = `${this.seed}|${LINE}|${PAPER}|${this.biome ? this.biome.id : ""}`;
    if (key === this.renderedKey) return;
    this.layers = BACKGROUND_LAYERS.map((layer, i) => ({ layer, image: this.renderLayer(layer, i) }));
    this.renderedKey = key;
  }

  drawSun() {
    const x = 1010;
    const y = 130;
    const t = this.time;
    ctx.save();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 1.5, y - 1, 34, 0.3, Math.PI * 1.8);
    ctx.stroke();
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = t * 0.12 + (i / 12) * Math.PI * 2;
      const r1 = 46;
      const r2 = 56 + (i % 2) * 8 + Math.sin(t * 2 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw() {
    this.ensureRendered();
    if (Sky.isNight()) drawMoon(1010, 130, this.time);
    else this.drawSun();
    for (const { layer, image } of this.layers) {
      const span = W * 2;
      const offset = (this.time * layer.speed) % span;
      ctx.drawImage(image, -offset, 0);
      ctx.drawImage(image, span - offset, 0);
    }
  }
}

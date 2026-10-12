"use strict";

class Terrain {
  constructor() {
    this.points = [];
    this.art = null;
    this.artKey = "";
    this.regenerate();
  }

  // Call after changing `points` (e.g. craters) so the cached art is redrawn.
  invalidate() {
    this.artKey = "";
  }

  regenerate() {
    this.seed = Math.floor(Math.random() * 1e9);
    this.invalidate();
    const minY = H * 0.64;
    const maxY = H * 0.86;
    let x = -90;
    let y = rand(minY + 80, maxY - 60);
    this.points = [[x, y]];
    while (x < W + 90) {
      x += Math.floor(rand(8, 21));
      y = clamp(y + rand(-100, 100), minY, maxY);
      this.points.push([x, y]);
    }
    for (let pass = 0; pass < 5; pass++) this.smooth();
    this.points = this.points.map(([px, py]) => {
      const d = Math.abs(px - W * 0.5) / (W * 0.5);
      return [px, clamp(py + (1 - Math.min(d, 1)) * rand(20, 52), minY, maxY)];
    });
  }

  // Digs a smooth crater centred on x. The ground never drops below 93% of the screen height.
  crater(cx, radius, depth) {
    const floor = H * 0.93;
    let changed = false;
    this.points = this.points.map(([x, y]) => {
      const d = Math.abs(x - cx) / radius;
      if (d >= 1) return [x, y];
      changed = true;
      return [x, Math.min(floor, y + depth * (1 - d * d))];
    });
    if (changed) this.invalidate();
    return changed;
  }

  smooth() {
    const next = [this.points[0]];
    for (let i = 1; i < this.points.length - 1; i++) {
      const [x, y] = this.points[i];
      next.push([x, y * 0.5 + (this.points[i - 1][1] + this.points[i + 1][1]) * 0.25]);
    }
    next.push(this.points[this.points.length - 1]);
    this.points = next;
  }

  yAt(x) {
    for (let i = 0; i < this.points.length - 1; i++) {
      const [x1, y1] = this.points[i];
      const [x2, y2] = this.points[i + 1];
      if (x >= x1 && x <= x2) {
        const p = (x - x1) / (x2 - x1);
        return y1 + (y2 - y1) * p;
      }
    }
    return this.points[this.points.length - 1][1];
  }

  slopeAt(x) {
    return Math.atan2(this.yAt(x + 8) - this.yAt(x - 8), 16);
  }

  tracePath(g, jitter = 0, random = Math.random) {
    g.beginPath();
    this.points.forEach(([x, y], i) => {
      const jy = y + (jitter ? (random() - 0.5) * jitter : 0);
      if (i) g.lineTo(x, jy);
      else g.moveTo(x, jy);
    });
  }

  // Pre-renders the ground: fill, depth hatching, pebbles, grass tufts and an inked outline.
  renderArt() {
    const random = seededRandom(this.seed);
    const off = this.art || document.createElement("canvas");
    off.width = W;
    off.height = H;
    const g = off.getContext("2d");
    g.clearRect(0, 0, W, H);
    g.lineCap = "round";
    g.lineJoin = "round";

    // Ground fill.
    this.tracePath(g);
    g.lineTo(W + 100, H + 10);
    g.lineTo(-100, H + 10);
    g.closePath();
    g.fillStyle = PAPER;
    g.fill();

    // Hatching, clipped to the ground, densest just under the surface.
    g.save();
    g.clip();
    g.strokeStyle = rgbaFromHex(LINE, 0.22);
    g.lineWidth = 1;
    for (let x = -60; x < W + 60; x += 7) {
      const surface = this.yAt(clamp(x, 0, W));
      const depth = 18 + random() * 26;
      g.beginPath();
      g.moveTo(x, surface + 6);
      g.lineTo(x - depth * 0.6, surface + 6 + depth);
      g.stroke();
    }
    // Sparse cross-hatching deeper down.
    g.strokeStyle = rgbaFromHex(LINE, 0.12);
    for (let i = 0; i < 160; i++) {
      const x = random() * W;
      const y = this.yAt(x) + 40 + random() * (H - this.yAt(x) - 40);
      const len = 6 + random() * 8;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + len * 0.6, y + len);
      g.moveTo(x + len * 0.6, y);
      g.lineTo(x, y + len);
      g.stroke();
    }
    // Pebbles.
    g.lineWidth = 1.5;
    for (let i = 0; i < 70; i++) {
      const x = random() * W;
      const y = this.yAt(x) + 10 + random() * 60;
      const r = 2 + random() * 4;
      g.fillStyle = rgbaFromHex(LINE, 0.08);
      g.strokeStyle = rgbaFromHex(LINE, 0.35);
      g.beginPath();
      g.ellipse(x, y, r * 1.4, r, random() * Math.PI, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.restore();

    // Inked outline: a bold stroke plus a thin, slightly offset second pass.
    g.strokeStyle = LINE;
    g.lineWidth = settings.terrainLine;
    this.tracePath(g);
    g.stroke();
    g.globalAlpha = 0.45;
    g.lineWidth = 1.2;
    this.tracePath(g, 3, random);
    g.stroke();
    g.globalAlpha = 1;

    // Grass tufts along the surface.
    g.strokeStyle = LINE;
    g.lineWidth = 1.5;
    for (let x = 4; x < W; x += 9 + random() * 16) {
      if (random() < 0.35) continue;
      const y = this.yAt(x);
      const slope = this.slopeAt(x);
      const blades = 2 + Math.floor(random() * 3);
      for (let b = 0; b < blades; b++) {
        const bx = x + (b - blades / 2) * 2.5;
        const h = 4 + random() * 6;
        const lean = (random() - 0.5) * 5 + Math.sin(slope) * 3;
        g.beginPath();
        g.moveTo(bx, y + 1);
        g.quadraticCurveTo(bx + lean * 0.3, y - h * 0.6, bx + lean, y - h);
        g.stroke();
      }
    }
    this.art = off;
  }

  draw() {
    const key = `${this.seed}|${LINE}|${PAPER}|${this.points.length}`;
    if (key !== this.artKey) {
      this.renderArt();
      this.artKey = key;
    }
    ctx.drawImage(this.art, 0, 0);
  }
}

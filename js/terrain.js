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

  regenerate(biome = BIOMES[0]) {
    this.biome = biome;
    this.seed = Math.floor(Math.random() * 1e9);
    this.invalidate();
    const shape = biome.terrain;
    const minY = H * shape.minY;
    const maxY = H * shape.maxY;
    let x = -90;
    let y = rand(minY + (maxY - minY) * 0.35, maxY - (maxY - minY) * 0.27);
    this.points = [[x, y]];
    while (x < W + 90) {
      x += Math.floor(rand(8, 21));
      y = clamp(y + rand(-shape.rough, shape.rough), minY, maxY);
      this.points.push([x, y]);
    }
    for (let pass = 0; pass < shape.smooth; pass++) this.smooth();
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
    const biome = this.biome || BIOMES[0];
    if (biome.ground) {
      g.fillStyle = Biomes.rgba(biome.ground);
      g.fill();
    }

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
    this.renderBiomeGround(g, random, biome);
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

    this.renderBiomeSurface(g, random, biome);

    // Grass tufts along the surface.
    g.strokeStyle = LINE;
    g.lineWidth = 1.5;
    for (let x = 4; x < W && biome.grass; x += 9 + random() * 16) {
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

  // Biome detail inside the ground (already clipped to it).
  renderBiomeGround(g, random, biome) {
    if (biome.stipple) {
      g.fillStyle = rgbaFromHex(LINE, 0.25);
      for (let i = 0; i < 500; i++) {
        const x = random() * W;
        const y = this.yAt(x) + 4 + random() * 120;
        g.fillRect(x, y, 1.5, 1.5);
      }
    }
    if (biome.cracks) {
      g.strokeStyle = "rgba(255,120,40,0.7)";
      g.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        let x = random() * W;
        let y = this.yAt(x) + 20 + random() * 80;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += (random() - 0.5) * 30;
          y += 6 + random() * 12;
          g.lineTo(x, y);
        }
        g.stroke();
      }
    }
    if (biome.candy) {
      // Candy-cane stripes and sprinkles.
      g.lineWidth = 9;
      g.strokeStyle = "rgba(230,60,90,0.28)";
      for (let x = -80; x < W + 80; x += 34) {
        g.beginPath();
        g.moveTo(x, H * 0.55);
        g.lineTo(x + 90, H);
        g.stroke();
      }
      const sprinkles = ["#e2445c", "#3fa7d6", "#f6c445", "#7bc96f", "#ffffff"];
      for (let i = 0; i < 160; i++) {
        const x = random() * W;
        const y = this.yAt(x) + 6 + random() * 90;
        g.save();
        g.translate(x, y);
        g.rotate(random() * Math.PI);
        g.fillStyle = sprinkles[i % sprinkles.length];
        g.fillRect(-3, -1, 6, 2.2);
        g.restore();
      }
    }
    if (biome.reeds) {
      // Murky puddles just under the surface.
      g.fillStyle = "rgba(60,90,70,0.35)";
      for (let i = 0; i < 18; i++) {
        const x = random() * W;
        const y = this.yAt(x) + 14 + random() * 50;
        g.beginPath();
        g.ellipse(x, y, 14 + random() * 22, 4 + random() * 3, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (biome.tiles) {
      // Checked tiles under the counter top.
      const size = 34;
      for (let x = 0; x < W; x += size) {
        for (let y = H * 0.68; y < H; y += size) {
          if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
            g.fillStyle = rgbaFromHex(BLUE, 0.13);
            g.fillRect(x, y, size, size);
          }
        }
      }
    }
  }

  // Biome detail on top of the surface line.
  renderBiomeSurface(g, random, biome) {
    if (biome.reeds) {
      // Reeds and cattails poking out of the bog.
      g.lineWidth = 1.5;
      for (let x = 10; x < W; x += 20 + random() * 40) {
        if (random() < 0.4) continue;
        const y = this.yAt(x);
        const n = 2 + Math.floor(random() * 3);
        for (let k = 0; k < n; k++) {
          const bx = x + k * 4;
          const h = 14 + random() * 14;
          const lean = (random() - 0.5) * 8;
          g.strokeStyle = rgbaFromHex(LINE, 0.8);
          g.beginPath();
          g.moveTo(bx, y + 1);
          g.quadraticCurveTo(bx + lean * 0.3, y - h * 0.6, bx + lean, y - h);
          g.stroke();
          if (k === 0) {
            g.fillStyle = "#7a4a2a";
            g.beginPath();
            g.ellipse(bx + lean * 0.85, y - h * 0.85, 2.2, 5, 0, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
    }
    if (biome.candy) {
      // White icing dripping over the edge, with gumdrops.
      g.fillStyle = "#fff8fb";
      g.strokeStyle = rgbaFromHex(LINE, 0.5);
      g.lineWidth = 1;
      g.beginPath();
      this.points.forEach(([x, y], i) => (i ? g.lineTo(x, y - 2) : g.moveTo(x, y - 2)));
      for (let i = this.points.length - 1; i >= 0; i--) {
        const [x, y] = this.points[i];
        g.lineTo(x, y + 5 + Math.max(0, Math.sin(x * 0.11)) * 7);
      }
      g.closePath();
      g.fill();
      g.stroke();
      const drops = ["#e2445c", "#7bc96f", "#f6c445", "#9b6bd6"];
      for (let i = 0; i < 12; i++) {
        const x = 30 + random() * (W - 60);
        const y = this.yAt(x);
        g.fillStyle = drops[i % drops.length];
        g.strokeStyle = LINE;
        g.beginPath();
        g.arc(x, y - 1, 5, Math.PI, 0);
        g.lineTo(x + 5, y + 1);
        g.lineTo(x - 5, y + 1);
        g.closePath();
        g.fill();
        g.stroke();
      }
    }
    if (biome.snowCap) {
      g.fillStyle = "#ffffff";
      g.strokeStyle = rgbaFromHex(LINE, 0.5);
      g.lineWidth = 1;
      g.beginPath();
      this.points.forEach(([x, y], i) => (i ? g.lineTo(x, y - 3) : g.moveTo(x, y - 3)));
      for (let i = this.points.length - 1; i >= 0; i--) {
        const [x, y] = this.points[i];
        g.lineTo(x, y + 4 + Math.sin(x * 0.07) * 3);
      }
      g.closePath();
      g.fill();
      g.stroke();
    }
    if (biome.tiles) {
      // Counter edge: a thick lip just under the surface.
      g.strokeStyle = rgbaFromHex(LINE, 0.6);
      g.lineWidth = 2;
      g.beginPath();
      this.points.forEach(([x, y], i) => (i ? g.lineTo(x, y + 10) : g.moveTo(x, y + 10)));
      g.stroke();
    }
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

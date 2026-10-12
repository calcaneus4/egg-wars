"use strict";

class Terrain {
  constructor() {
    this.points = [];
    this.regenerate();
  }

  regenerate() {
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

  draw() {
    // Solid ground so background layers don't show through below the surface.
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    this.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.lineTo(W + 100, H + 10);
    ctx.lineTo(-100, H + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = settings.terrainLine;
    ctx.beginPath();
    this.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  }
}

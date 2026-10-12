"use strict";

function line(x1, y1, x2, y2, color = LINE, width = sw(2)) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(x, y, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = sw(2);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

// Translucent team-colored fill under line art.
function teamFill(color, alpha = 0.22) {
  ctx.fillStyle = rgbaFromHex(color, alpha);
  ctx.fill();
}

function drawPlaneShape(x, y, side, color, lengthScale) {
  ctx.strokeStyle = color;
  ctx.lineWidth = sw(2);
  const nose = [x + side * s(32 * lengthScale), y];
  const tail = [x - side * s(28 * lengthScale), y + s(2)];
  ctx.beginPath();
  ctx.moveTo(...nose);
  ctx.lineTo(x - side * s(14 * lengthScale), y - s(8));
  ctx.lineTo(...tail);
  ctx.lineTo(x - side * s(12 * lengthScale), y + s(8));
  ctx.closePath();
  teamFill(color, 0.28);
  ctx.stroke();
  // Cockpit window.
  ctx.beginPath();
  ctx.ellipse(x + side * s(16 * lengthScale), y - s(2), s(4), s(2.5), 0, 0, Math.PI * 2);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - side * s(2), y - s(2));
  ctx.lineTo(x - side * s(18 * lengthScale), y + s(20));
  ctx.lineTo(x + side * s(14 * lengthScale), y + s(4));
  ctx.closePath();
  teamFill(color, 0.15);
  ctx.stroke();
  line(tail[0], tail[1], tail[0] - side * s(10), tail[1] - s(14), color);
}

function drawCloud(x, y, scale) {
  const pts = [[-84, 18], [-62, 2], [-36, 7], [-22, -16], [6, -8], [26, -24], [50, -3], [76, 4], [88, 22], [-84, 18]];
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  pts.forEach(([px, py], i) => i ? ctx.lineTo(x + px * scale, y + py * scale) : ctx.moveTo(x + px * scale, y + py * scale));
  ctx.stroke();
}

function drawScreenBorder() {
  const inset = settings.terrainLine / 2;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = settings.terrainLine;
  ctx.strokeRect(inset, inset, W - settings.terrainLine, H - settings.terrainLine);
}

function drawWreckage(w) {
  const { x, y, kind } = w;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = sw(2);
  if (kind === "tank") {
    ctx.beginPath();
    [[-28, -8], [-12, -18], [20, -10], [34, -15]].forEach(([px, py], i) => i ? ctx.lineTo(x + s(px), y + s(py)) : ctx.moveTo(x + s(px), y + s(py)));
    ctx.stroke();
    line(x + s(6), y - s(17), x + s(32), y - s(28), LINE, sw(3));
    [-20, 4, 24].forEach((off) => {
      circle(x + s(off), y - s(4), s(8), LINE);
      line(x + s(off - 5), y - s(9), x + s(off + 5), y + s(1), LINE);
    });
  }
  if (kind === "motorcycle") {
    circle(x - s(17), y - s(4), s(7), LINE);
    circle(x + s(16), y - s(5), s(7), LINE);
    ctx.beginPath();
    [[-17, -4], [-2, -18], [16, -5], [5, -20]].forEach(([px, py], i) => i ? ctx.lineTo(x + s(px), y + s(py)) : ctx.moveTo(x + s(px), y + s(py)));
    ctx.stroke();
    line(x - s(2), y - s(18), x - s(12), y - s(28), LINE);
  }
  if (kind === "castle") {
    ctx.beginPath();
    [[-31, 0], [-27, -42], [-9, -25], [3, -58], [18, -32], [31, 0]].forEach(([px, py], i) => i ? ctx.lineTo(x + s(px), y + s(py)) : ctx.moveTo(x + s(px), y + s(py)));
    ctx.stroke();
    ctx.beginPath();
    [[-26, -42], [-16, -51], [-4, -42], [8, -52], [20, -40]].forEach(([px, py], i) => i ? ctx.lineTo(x + s(px), y + s(py)) : ctx.moveTo(x + s(px), y + s(py)));
    ctx.stroke();
    line(x - s(38), y - s(4), x + s(36), y - s(10), LINE);
  }
  if (kind === "air_debris") {
    const len = s(w.length || 22);
    const dx = Math.cos(w.angle || 0) * len * 0.5;
    const dy = Math.sin(w.angle || 0) * len * 0.5;
    line(x - dx, y - dy, x + dx, y + dy, LINE, sw(2));
    line(x - dy * 0.35, y + dx * 0.35, x + dy * 0.35, y - dx * 0.35, LINE, sw(1));
  }
}

function drawSpeechBubble(unit) {
  if (!unit.speechText || unit.speechTimer <= 0) return;
  ctx.font = "bold 16px Courier New";
  const padX = 7;
  const padY = 4;
  const textWidth = ctx.measureText(unit.speechText).width;
  const bubbleW = textWidth + padX * 2;
  const bubbleH = 24;
  const x = clamp(unit.x - bubbleW / 2, 8, W - bubbleW - 8);
  const y = Math.max(56, unit.y - unit.radius() - bubbleH - 10);
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, bubbleW, bubbleH);
  ctx.strokeRect(x, y, bubbleW, bubbleH);
  const tailX = clamp(unit.x, x + 6, x + bubbleW - 6);
  ctx.beginPath();
  ctx.moveTo(tailX - 5, y + bubbleH - 1);
  ctx.lineTo(tailX + 5, y + bubbleH - 1);
  ctx.lineTo(tailX, y + bubbleH + 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = LINE;
  ctx.fillText(unit.speechText, x + padX, y + bubbleH - padY - 2);
}

function drawHelicopterShape(x, y, facing, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = sw(2);
  ctx.beginPath();
  ctx.ellipse(x, y + s(6), s(37), s(12), 0, 0, Math.PI * 2);
  teamFill(color, 0.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + facing * s(20), y + s(4), s(9), s(6), 0, 0, Math.PI * 2);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.stroke();
  line(x, y + s(6), x + facing * s(46), y + s(6), color);
  circle(x + facing * s(46), y + s(6), s(3), color);
  line(x, y - s(6), x, y - s(18), color);
  const spin = Math.cos(performance.now() * 0.04);
  line(x - s(62) * spin, y - s(18), x + s(62) * spin, y - s(18), color);
  line(x - s(30), y - s(23) + spin * s(3), x + s(30), y - s(13) - spin * s(3), color);
  line(x - facing * s(34), y + s(4), x - facing * s(78), y - s(3), color);
  line(x - facing * s(78), y - s(13), x - facing * s(78), y + s(7), color);
  line(x - s(35), y + s(26), x + s(35), y + s(26), color);
  line(x - s(22), y + s(17), x - s(30), y + s(26), color);
  line(x + s(22), y + s(17), x + s(30), y + s(26), color);
}

function drawText(text, x, y) {
  ctx.fillStyle = LINE;
  ctx.font = "bold 22px Courier New";
  ctx.fillText(text, x, y);
}

function centerText(text, y) {
  ctx.fillText(text, (W - ctx.measureText(text).width) / 2, y);
}

function unitType(u) {
  if (u.isBoss) return "boss";
  if (u instanceof Medic) return "medic";
  if (u instanceof MortarHen) return "mortar";
  if (u instanceof RoosterRider) return "rider";
  if (u instanceof CatapultWagon) return "catapult";
  if (u instanceof MonsterTruck) return "truck";
  if (u instanceof ChickBalloon) return "balloon";
  if (u instanceof Castle) return "castle";
  if (u instanceof Drone) return "drone";
  if (u instanceof Helicopter) return "helicopter";
  if (u instanceof Bomber) return "bomber";
  if (u instanceof Airplane) return "airplane";
  if (u instanceof Tank) return "tank";
  if (u instanceof Motorcycle) return "motorcycle";
  return "soldier";
}

// Small waving pennant on a pole whose foot is at (x, y).
function drawFlag(x, y, height, color, side) {
  const tip = y - height;
  line(x, y, x, tip, LINE, sw(1.5));
  const wave = Math.sin(performance.now() * 0.006 + x * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, tip);
  ctx.quadraticCurveTo(x + side * height * 0.25, tip + height * 0.08 + wave * 2, x + side * height * 0.5, tip + height * 0.12 + wave * 3);
  ctx.lineTo(x, tip + height * 0.3);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Zigzag cracks for a damaged unit; `seed` keeps the pattern stable between frames.
function drawCracks(x, y, size, severity, seed) {
  const count = Math.min(3, Math.ceil(severity * 3));
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < count; i++) {
    const a = seed * 7 + i * 2.1;
    let px = x + Math.cos(a) * size * 0.25;
    let py = y + Math.sin(a * 1.3) * size * 0.15;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let k = 0; k < 3; k++) {
      px += Math.cos(a + k) * size * 0.12;
      py += Math.sin(a * 2 + k * 1.7) * size * 0.1;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

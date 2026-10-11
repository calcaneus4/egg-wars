"use strict";

const game = new Game();
let last = performance.now();
const holdAdd = {
  button: null,
  delayTimer: null,
  repeatTimer: null,
};

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.draw();
  requestAnimationFrame(frame);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * W / rect.width,
    y: (event.clientY - rect.top) * H / rect.height,
  };
}

function clearHoldAdd() {
  if (holdAdd.delayTimer) clearTimeout(holdAdd.delayTimer);
  if (holdAdd.repeatTimer) clearInterval(holdAdd.repeatTimer);
  holdAdd.button = null;
  holdAdd.delayTimer = null;
  holdAdd.repeatTimer = null;
}

function addHeldButton() {
  if (!holdAdd.button || game.winner) return;
  game.buyUnit(holdAdd.button);
}

function unlockAudio() {
  audio.ensure();
}

window.addEventListener("pointerdown", unlockAudio, { passive: true });
window.addEventListener("touchstart", unlockAudio, { passive: true });
window.addEventListener("keydown", unlockAudio);

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  audio.ensure();
  clearHoldAdd();
  const point = canvasPoint(event);
  const button = game.buttonAt(point.x, point.y);
  if (!button || game.winner) {
    game.click(point.x, point.y);
    return;
  }
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  holdAdd.button = { ...button };
  addHeldButton();
  holdAdd.delayTimer = setTimeout(() => {
    addHeldButton();
    holdAdd.repeatTimer = setInterval(addHeldButton, 120);
  }, 380);
});

canvas.addEventListener("pointerup", clearHoldAdd);
canvas.addEventListener("pointercancel", clearHoldAdd);
canvas.addEventListener("lostpointercapture", clearHoldAdd);

window.addEventListener("keydown", (event) => {
  unlockAudio();
  if (event.key === "r" || event.key === "R") game.restart();
  if (event.key === "Escape") game.winner = "PAUSED";
});

requestAnimationFrame(frame);

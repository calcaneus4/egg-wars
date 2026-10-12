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
  if (!holdAdd.button || game.winner || game.scene !== "battle") return;
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
  if (game.scene !== "battle") {
    Menus.click(game, point.x, point.y);
    return;
  }
  if (Tutorial.hit(point.x, point.y)) return;
  const abilityButton = !game.winner && Hud.abilityButtonAt(point.x, point.y);
  if (abilityButton) {
    Abilities.use(game, abilityButton.id);
    return;
  }
  const eggChip = !game.winner && Hud.eggButtonAt(point.x, point.y);
  if (eggChip) {
    game.profile.yolkEgg = eggChip.id;
    SaveManager.save();
    audio.play("click");
    return;
  }
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
  if (event.key === "Escape" || event.key === "p" || event.key === "P") {
    clearHoldAdd();
    game.togglePause();
  }
  if (event.key === "m" || event.key === "M") {
    SaveManager.data.settings.muted = !SaveManager.data.settings.muted;
    applyPlayerSettings();
    SaveManager.save();
  }
  if ((event.key === "r" || event.key === "R") && game.scene === "battle") game.restart();
  const powerSlot = POWER_SLOT_KEYS.indexOf(event.key.toUpperCase());
  if (powerSlot >= 0 && game.scene === "battle") Abilities.useSlot(game, powerSlot);
  if ((event.key === "q" || event.key === "Q") && game.scene === "battle") {
    EggTypes.cycle(game.profile);
    SaveManager.save();
    audio.play("click");
  }
  const slot = SHOP_KEYS.indexOf(event.key);
  if (game.scene === "battle" && !game.winner && slot >= 0) {
    const button = game.buttons.find((b) => b.type === SHOP_ORDER[slot]);
    if (button) game.buyUnit(button);
  }
  if ((event.key === "Enter" || event.key === " ") && game.scene === "title") game.startBattle();
  else if ((event.key === "Enter" || event.key === " ") && game.scene === "battle" && game.winner) game.click(-1, -1);
});

requestAnimationFrame(frame);

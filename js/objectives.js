"use strict";

// Optional bonus goals: each stage rolls 1-2 from this pool (from a seed, so a stage keeps the
// same goals on a retry). Completed goals pay Golden Eggs even if the round is lost, unless the
// goal itself needs a win (DESIGN.md section 6).

const OBJECTIVES = [
  {
    id: "speed",
    reward: 2,
    needsWin: true,
    text: (o) => `Win in under ${o.target}s`,
    setup: (game) => ({ target: Math.round(game.roundLimit * 0.6) }),
    done: (game, o, won) => won && game.roundTime <= o.target,
  },
  {
    id: "noTankLoss",
    reward: 1,
    needsWin: true,
    available: (game) => game.living(RIGHT).some((u) => unitType(u) === "tank"),
    text: () => "Win without losing a tank",
    done: (game, o, won) => won && !game.track.tankLost,
  },
  {
    id: "yolkKills",
    reward: 1,
    text: (o) => `Destroy ${o.target} enemies with Yolk Drops (${Math.min(o.target, o.game.track.yolkKills)}/${o.target})`,
    setup: () => ({ target: 3 }),
    done: (game, o) => game.track.yolkKills >= o.target,
  },
  {
    id: "noBuy",
    reward: 1,
    needsWin: true,
    text: () => "Win without buying reinforcements",
    done: (game, o, won) => won && !game.track.bought,
  },
  {
    id: "castle",
    reward: 1,
    available: (game) => game.living(LEFT).some((u) => unitType(u) === "castle"),
    text: () => "Destroy the enemy castle",
    done: (game) => game.track.castleKilled,
  },
  {
    id: "survivors",
    reward: 1,
    needsWin: true,
    text: (o) => `Win with ${o.target}+ of your units alive`,
    setup: (game) => ({ target: Math.max(3, Math.round(game.living(RIGHT).length * 0.6)) }),
    done: (game, o, won) => won && game.living(RIGHT).length >= o.target,
  },
];

const Objectives = {
  start(game) {
    game.track = { tankLost: false, bought: false, yolkKills: 0, castleKilled: false };
    const random = seededRandom(game.stage * 7727 + 91);
    const pool = OBJECTIVES.filter((o) => !o.available || o.available(game));
    const count = game.stage >= 3 ? 2 : 1;
    game.objectives = [];
    while (game.objectives.length < count && pool.length) {
      const def = pool.splice(Math.floor(random() * pool.length), 1)[0];
      game.objectives.push({ def, game, ...((def.setup && def.setup(game)) || {}), complete: false });
    }
  },

  // Called when any unit is destroyed. `source` is the egg's source tag ("yolk", ...).
  onKill(game, unit, source) {
    if (!game.track) return;
    if (unit.side === LEFT && source === "yolk") game.track.yolkKills++;
    if (unit.side === LEFT && unitType(unit) === "castle") game.track.castleKilled = true;
    if (unit.side === RIGHT && unitType(unit) === "tank") game.track.tankLost = true;
  },

  // Marks goals as complete at the end of a round and returns the Golden Eggs they pay.
  finish(game, won) {
    let eggs = 0;
    for (const o of game.objectives || []) {
      o.complete = o.def.done(game, o, won);
      if (o.complete) eggs += o.def.reward;
    }
    return eggs;
  },

  // Live status during battle (for the HUD tick marks).
  liveStatus(game, o) {
    if (o.def.id === "yolkKills" || o.def.id === "castle") return o.def.done(game, o, false);
    if (o.def.id === "speed") return game.roundTime <= o.target ? null : false;
    if (o.def.id === "noTankLoss") return game.track.tankLost ? false : null;
    if (o.def.id === "noBuy") return game.track.bought ? false : null;
    return null;
  },

  draw(game) {
    if (!game.objectives || !game.objectives.length || game.winner || game.scene !== "battle") return;
    const secondRow = game.buttons.some((b) => b.y > SHOP_CARD.y + SHOP_CARD.h);
    let y = secondRow ? 146 : 82;
    ctx.save();
    ctx.font = "bold 12px Courier New";
    ctx.fillStyle = LINE;
    ctx.fillText("BONUS GOALS", 14, y);
    y += 6;
    for (const o of game.objectives) {
      const status = this.liveStatus(game, o);
      y += 17;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, y - 10, 11, 11);
      if (status === true) {
        line(16, y - 5, 19, y - 1, BLUE, 2);
        line(19, y - 1, 24, y - 9, BLUE, 2);
      } else if (status === false) {
        line(16, y - 8, 23, y - 1, RED, 2);
        line(23, y - 8, 16, y - 1, RED, 2);
      }
      ctx.fillStyle = status === false ? rgbaFromHex(LINE, 0.45) : LINE;
      ctx.fillText(`${o.def.text(o)}  +${o.def.reward} GE`, 31, y);
    }
    ctx.restore();
  },
};

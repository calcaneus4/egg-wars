"use strict";

// Lifetime statistics page (title screen > STATS). Numbers come from SaveManager.data.stats;
// per-unit purchase counts are stored as `bought_<type>` keys.

const UNIT_NAMES = {
  soldier: "Soldier", tank: "Tank", motorcycle: "Motorcycle", drone: "Drone", airplane: "Airplane",
  helicopter: "Helicopter", bomber: "Bomber", castle: "Castle", medic: "Egg Medic", mortar: "Mortar Hen", rider: "Rooster Rider",
};

const Stats = {
  data() {
    return SaveManager.data.stats;
  },

  add(key, amount = 1) {
    const s = this.data();
    s[key] = (Number.isFinite(s[key]) ? s[key] : 0) + amount;
  },

  favouriteUnit() {
    const s = this.data();
    let best = null;
    for (const type of SHOP_ORDER) {
      const n = s[`bought_${type}`] || 0;
      if (n > 0 && (!best || n > best.n)) best = { type, n };
    }
    return best;
  },

  formatTime(seconds) {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return m ? `${m}m ${String(sec).padStart(2, "0")}s` : `${seconds.toFixed(1)}s`;
  },

  draw(game) {
    const s = this.data();
    const p = game.profile;
    Menus.veil(0.95);
    ctx.save();
    ctx.fillStyle = LINE;
    ctx.font = "bold 40px Courier New";
    centerText("BATTLE RECORD", 70);
    const played = s.wins + s.losses;
    const fav = this.favouriteUnit();
    const hours = s.playSeconds / 3600;
    const left = [
      ["Battles fought", played],
      ["Victories", s.wins],
      ["Defeats", s.losses],
      ["Win rate", played ? `${Math.round((s.wins / played) * 100)}%` : "-"],
      ["Current stage", p.stage],
      ["Player level", p.level],
      ["Bosses beaten", s.bossesBeaten],
      ["Bonus goals done", s.goalsCompleted],
      ["Time in battle", hours >= 1 ? `${hours.toFixed(1)} h` : this.formatTime(s.playSeconds)],
    ];
    const right = [
      ["Enemies destroyed", s.kills],
      ["Yolk Drop kills", s.yolkKills],
      ["Eggs thrown", s.eggsThrown],
      ["Reinforcements bought", s.unitsBought],
      ["Favourite unit", fav ? `${UNIT_NAMES[fav.type]} (${fav.n})` : "-"],
      ["Fastest win", this.formatTime(s.bestWinTime)],
      ["Fastest wipeout", this.formatTime(s.bestWipeoutTime)],
      ["Gold earned", `$${s.goldEarned}`],
      ["Golden Eggs earned", s.goldenEggsEarned],
    ];
    const drawColumn = (rows, x) => {
      rows.forEach(([label, value], i) => {
        const y = 130 + i * 44;
        ctx.strokeStyle = rgbaFromHex(LINE, 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 12);
        ctx.lineTo(x + 470, y + 12);
        ctx.stroke();
        ctx.fillStyle = LINE;
        ctx.font = "bold 18px Courier New";
        ctx.fillText(label, x, y);
        const v = String(value);
        ctx.font = "bold 20px Courier New";
        ctx.fillText(v, x + 470 - ctx.measureText(v).width, y);
      });
    };
    drawColumn(left, 90);
    drawColumn(right, 640);
    if (fav) drawUnitIcon(fav.type, 1150, 306, 30, BLUE);
    ctx.restore();
    Menus.button("BACK", W / 2, H - 70, 260, () => { game.scene = "title"; }).hot = true;
  },
};

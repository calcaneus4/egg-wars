"use strict";

// World map: a winding path through the five biomes (25 stages per page). Cleared stages can be
// replayed as practice (half gold and XP, no Golden Eggs, progress unchanged); the current
// stage is the next real battle. Boss stages are marked with a crown.

const PRACTICE_REWARD_SCALE = 0.5;
const MAP_PAGE = BIOME_STAGES * 5;

const WorldMap = {
  page: null,
  selected: null,

  open(game) {
    const frontier = game.practice ? game.frontier : game.stage;
    this.page = Math.floor((frontier - 1) / MAP_PAGE);
    this.selected = frontier;
    game.scene = "map";
  },

  frontier(game) {
    return game.practice ? game.frontier : game.stage;
  },

  nodePos(i) {
    // Five bands of five, each band a gentle zig-zag.
    const band = Math.floor(i / BIOME_STAGES);
    const k = i % BIOME_STAGES;
    const bandW = (W - 80) / 5;
    const x = 40 + band * bandW + bandW * (0.15 + 0.7 * (k / (BIOME_STAGES - 1)));
    const y = 300 + Math.sin(i * 1.3) * 70 + (k % 2 ? 28 : -28);
    return [x, y];
  },

  draw(game) {
    Menus.veil(0.95);
    const frontier = this.frontier(game);
    const first = this.page * MAP_PAGE + 1;
    const bandW = (W - 80) / 5;
    ctx.save();
    ctx.fillStyle = LINE;
    ctx.font = "bold 40px Courier New";
    centerText("WORLD MAP", 64);
    ctx.font = "bold 16px Courier New";
    centerText(`Stages ${first}-${first + MAP_PAGE - 1}   (current: stage ${frontier})`, 92);

    // Biome bands.
    for (let b = 0; b < 5; b++) {
      const biome = Biomes.forStage(first + b * BIOME_STAGES);
      const x = 40 + b * bandW;
      ctx.fillStyle = biome.ground ? Biomes.rgba(biome.ground, 0.9) : rgbaFromHex(BLUE, 0.06);
      ctx.fillRect(x + 4, 120, bandW - 8, 330);
      ctx.strokeStyle = rgbaFromHex(LINE, 0.4);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 4, 120, bandW - 8, 330);
      ctx.fillStyle = LINE;
      ctx.font = "bold 15px Courier New";
      const name = biome.name.toUpperCase();
      ctx.fillText(name, x + (bandW - ctx.measureText(name).width) / 2, 142);
    }

    // Dotted path.
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = rgbaFromHex(LINE, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < MAP_PAGE; i++) {
      const [x, y] = this.nodePos(i);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Nodes.
    this.nodes = [];
    for (let i = 0; i < MAP_PAGE; i++) {
      const stage = first + i;
      const [x, y] = this.nodePos(i);
      const boss = Bosses.isBossStage(stage);
      const r = boss ? 20 : 15;
      const cleared = stage < frontier;
      const current = stage === frontier;
      this.nodes.push({ x, y, r, stage });
      ctx.globalAlpha = stage > frontier ? 0.35 : 1;
      ctx.fillStyle = current ? YOLK : cleared ? rgbaFromHex(BLUE, 0.35) : PAPER;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = stage === this.selected ? 4 : 2;
      ctx.beginPath();
      ctx.arc(x, y, r + (current ? Math.sin(performance.now() * 0.006) * 2 : 0), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = LINE;
      ctx.font = "bold 12px Courier New";
      const label = String(stage);
      ctx.fillText(label, x - ctx.measureText(label).width / 2, y + 4);
      if (boss) {
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.moveTo(x - 12, y - r - 2);
        ctx.lineTo(x - 12, y - r - 12);
        ctx.lineTo(x - 6, y - r - 6);
        ctx.lineTo(x, y - r - 14);
        ctx.lineTo(x + 6, y - r - 6);
        ctx.lineTo(x + 12, y - r - 12);
        ctx.lineTo(x + 12, y - r - 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Info panel for the selected stage.
    const st = this.selected;
    if (st) {
      const biome = Biomes.forStage(st);
      const boss = Bosses.isBossStage(st);
      const enemy = boss ? `BOSS: ${["Giant Rooster Mech", "Omelet Fortress", "Scrambler Zeppelin"][["mech", "fortress", "zeppelin"].indexOf(Bosses.kindForStage(st))]}` : `Enemy: ${Personalities.forStage(st).name.toLowerCase()}`;
      ctx.fillStyle = LINE;
      ctx.font = "bold 18px Courier New";
      centerText(`STAGE ${st} - ${biome.name} - ${Sky.phaseForStage(st)} - ${enemy}`, 486);
      ctx.font = "14px Courier New";
      const note = st < frontier ? "Cleared. Replay as practice: half gold and XP, no Golden Eggs, progress unchanged."
        : st === frontier ? "Your next battle." : "Locked - clear the stages before it first.";
      centerText(note, 510);
    }
    ctx.restore();

    if (st && st <= frontier) {
      const label = st === frontier ? `PLAY STAGE ${st}` : `PRACTICE STAGE ${st}`;
      Menus.button(label, W / 2, 530, 340, () => (st === frontier ? game.startBattle() : game.startPractice(st))).hot = true;
    }
    if (this.page > 0) Menus.button("< PREV", 110, 600, 160, () => { this.page--; });
    if ((this.page + 1) * MAP_PAGE < frontier) Menus.button("NEXT >", W - 110, 600, 160, () => { this.page++; });
    Menus.button("BACK", W / 2, 600, 220, () => { game.scene = "title"; });
  },

  click(game, x, y) {
    const node = (this.nodes || []).find((n) => dist(x, y, n.x, n.y) <= n.r + 4);
    if (!node) return false;
    this.selected = node.stage;
    audio.play("click");
    return true;
  },
};

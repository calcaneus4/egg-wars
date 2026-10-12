# Egg Wars Design: Progression & Difficulty

This document is the contract every feature must follow. Numbers live in code as named
constants (in `js/config.js` once the module split lands) and must match the formulas here.

Notation: `n` = stage number (1, 2, 3, ...), `L` = player level, `ln` = natural log.

> Code note: in the source, the player's (blue) army uses the constant `RIGHT` because it
> marches to the right; the enemy (red) army uses `LEFT`.

## 1. Goals

1. **Difficulty rises slowly and smoothly.** No stage is ever much harder than the one before.
2. **Player power outgrows difficulty.** Upgrades and unlocks earned by playing always add up to
   more than the extra difficulty, so there is never a wall.
3. **Losing still pays.** Every round, won or lost, gives XP and gold.
4. **Help after a losing streak**, without punishing players who win.
5. **Something new every few levels.**
6. **Quick to learn**, through a short guided first battle and tips.

## 2. Currencies

| Currency | Earned by | Spent on | Persists |
|---|---|---|---|
| **Gold** ($) | Every round (win or loss) | Reinforcements during battle | Yes |
| **XP** | Every round, kills | Raises player level automatically | Yes |
| **Golden Eggs** (GE) | Wins, level-ups, objectives, achievements | Permanent Armory upgrades | Yes |

## 3. Difficulty curve

The single difficulty factor for stage `n`:

```
D(n) = 1 + 0.45 * ln(1 + (n - 1) / 4)
```

| n | 1 | 2 | 5 | 10 | 20 | 50 | 100 | 500 |
|---|---|---|---|---|---|---|---|---|
| D(n) | 1.00 | 1.10 | 1.31 | 1.53 | 1.79 | 2.16 | 2.46 | 3.18 |

The slope is `0.45 / (n + 3)`, so the step from one stage to the next is at most +10% (stage
1 to 2) and below +2% after stage 20. The curve never jumps.

Enemy stats come from `D(n)`:

```
enemy HP multiplier        h(n) = 1 + 0.35 * (D(n) - 1)
enemy fire-rate multiplier f(n) = 1 + 0.15 * (D(n) - 1)
enemy army size multiplier b(n) = 1 + 0.25 * (D(n) - 1)
enemy army point budget    B(n) = 120 * b(n)                 (see section 4)
round time limit           T(n) = 38 + 10 * (D(n) - 1) seconds (+/- 5 s random)
```

HP is rounded up per unit (`ceil`), never below the base HP. The total enemy strength is
`E(n) = h(n) * f(n) * b(n)`: 1.00 at stage 1, 1.45 at stage 10, 1.71 at stage 20, 2.52 at
stage 100. The constants are in `js/config.js` (`enemy*FromDifficulty`, `enemyBaseBudget`).

**Boss stages** (every 5th stage) use the same `D(n)`. The boss replaces about 40% of the
point budget, so a boss stage is not harder overall than a normal stage.

**Comparison with the original game**, which scaled HP linearly by +18% per stage: at stage 20
the original enemy had 4.4x HP. Under this model it has `h(20) = 1.28x`.

## 4. Enemy army budget

Each unit type has a point cost (roughly its threat):

| soldier | drone | motorcycle | tank | airplane | helicopter | bomber | castle |
|---|---|---|---|---|---|---|---|
| 3 | 2 | 6 | 10 | 10 | 12 | 16 | 20 |

The enemy always takes its castle first (as in the original game), then buys random units
from the budget `B(n)`, using its **personality** template weights. The personalities are
Balanced, Rusher, Turtle, Air Force and Artillery; see the roadmap. Stage 1 is always Balanced.

| Balanced weights | soldier 3 | tank 2 | motorcycle 1.5 | drone 1.5 | airplane 1 | helicopter 0.6 | bomber 0.5 |
|---|---|---|---|---|---|---|---|

Caps per type keep the battlefield readable (12 soldiers, 4 tanks, 3 motorcycles, 5 drones,
3 airplanes, 1 helicopter, 1 bomber, 1 castle = 182 points). Once `B(n)` passes that, the
leftover budget is dropped, which is a natural soft cap on army size.

`B(1) = 120` is about the average size of the original game's random army (about 127 points).

## 5. Player power and upgrades

### Armory tracks

Each track has levels `k = 0..20`. Buying level `k` costs `cost(k) = 1 + k` Golden Eggs
(1, 2, 3, ... 20, or 210 GE for a whole track).

| Track | Effect at level k |
|---|---|
| Thick Shells | player unit HP x `(1 + 0.08k)` (rounded up) |
| Rapid Lobbing | player fire rate x `(1 + 0.05k)` |
| Hard-Boiled Eggs | each player egg hit has a `0.04k` chance to deal 2 damage |
| War Chest | all round gold rewards (win and loss) x `(1 + 0.10k)` |
| Quick Yolk | all cooldowns (Yolk Drop, Airstrike, Shield) x `1 / (1 + 0.06k)` |
| Bulk Orders | reinforcement prices x `1 / (1 + 0.04k)`, rounded, at least $1 |

The Armory opens at player level 2 (title screen, or the button on the results screen).
HP and fire-rate upgrades apply to every player unit when it spawns, including reinforcements
and special units. Upgrades bought mid-round apply from the next spawned unit. Code:
`js/armory.js`.

### Effective power

Combat power in a duel scales roughly with `HP x damage-per-second`. The player's power from
the Armory is:

```
P = (1 + 0.08 k_hp) * (1 + 0.05 k_rate) * (1 + 0.04 k_dmg)
```

Enemy power from difficulty is:

```
E(n) = h(n) * f(n) * b(n)
```

### No-wall guarantee

Simulation (`node tools/balance-sim.js`, which loads the real game formulas): a player wins
every stage, gets about 8 kills per round, and spends only **half** of their Golden Eggs on
the three combat tracks, spread evenly and capped at 20:

| stage n | level | GE earned | combat levels (hp/rate/dmg) | P | E(n) | P/E |
|---|---|---|---|---|---|---|
| 3 | 2 | 7 | 1/1/1 | 1.18 | 1.14 | 1.03 |
| 5 | 3 | 14 | 2/2/1 | 1.33 | 1.25 | 1.06 |
| 10 | 5 | 30 | 3/3/2 | 1.54 | 1.45 | 1.06 |
| 20 | 9 | 72 | 5/4/4 | 1.95 | 1.71 | 1.14 |
| 50 | 16 | 243 | 9/8/8 | 3.18 | 2.13 | 1.49 |
| 100 | 24 | 717 | 15/15/14 | 6.01 | 2.52 | 2.39 |
| 200 | 35 | 2400 | 20/20/20 | 9.36 | 2.95 | 3.17 |

The script exits non-zero if `P < E(n)` at any checked stage from 3 on. Run it after changing
any balance constant.

`E(n)` grows like `ln(n)^2`, while GE income grows faster than linearly in `n`. So `P / E`
rises over time, and losing players earn GE too (section 6). With every track maxed
(`P = 9.36`), `E(n)` would only catch up around stage 10^6. Unlocked units, abilities and egg types are additional power on top of `P`;
they are the margin that lets the "spend half on other tracks" player keep pace too.

## 6. Rewards per round

```
won:
  gold  = round((25 + 2n) * warChest) + survivorBonus + wipeoutBonus(20)
  XP    = 40 + 12 * ln(n) + kills
  GE    = 2 + floor(n / 10) + objectiveBonus + (boss ? 3 : 0)
lost:
  gold  = 10 + n
  XP    = 0.5 * (40 + 12 * ln(n)) + kills
  GE    = 0, but every 2nd loss in a row grants 1 GE
          (so a losing player can still buy upgrades)
```

`survivorBonus = round(3 * sqrt(armyScore))`, where `armyScore` is the surviving player HP
(+4 per aircraft, +5 per castle). This is usually 20-35 gold. The original game paid 4 gold
per point, often 300+ gold per win, which made reinforcement prices meaningless.

## 7. Player level

XP needed to go from level `L` to `L + 1`:

```
xpToNext(L) = 60 + 30 * (L - 1)
```

A win at stage 5 is worth about 60 XP, so level 2 takes about 1 win and level 10 about 4
rounds. Each level-up grants **3 GE** and is often an unlock (section 8).

## 8. Unlock schedule (something new every 1-3 levels)

| Level | Unlock |
|---|---|
| 1 | Soldier, Tank, Motorcycle, Drone, Yolk Drop |
| 2 | Airplane, Armory opens |
| 3 | Mega Knight (special tank) |
| 4 | Cluster egg (Yolk Drop option) |
| 5 | Helicopter, Fire Wizard (special soldier) |
| 6 | Egg Medic |
| 7 | Bouncing egg, Omelet Airstrike ability |
| 8 | Bomber, Yolk Bomber (special bomber) |
| 10 | Castle, Sticky egg |
| 11 | Mortar Hen |
| 12 | Shell Shield ability |
| 14 | Explosive egg |
| 16 | Rooster Rider |
| 18 | Homing egg |
| 20+ | A cosmetic color scheme or title every 3 levels |

Biomes unlock by **stage**, not level: Meadow 1, Desert 6, Snowfield 11, Volcano 16, Kitchen
Counter 21, then they rotate. A boss appears every 5th stage.

The table lives in `js/unlocks.js`, and only content that already exists is listed. Each
feature adds its row when it ships. The HUD and the results screen always show the next
unlock ("NEXT AT LV 5: Helicopter, Fire Wizard"), and the results screen lists what a level-up
just unlocked. Locked unit buttons are greyed out with their unlock level.

**Armies.** The player's free army is built from a fixed budget of 120 points
(`playerArmyBudget`), using only unlocked unit types. Player power grows through the Armory
and specials, not through a bigger free army. Each army always gets its home castle. The enemy
can field a unit type from stage `2 * unlockLevel - 1`, which is roughly when a typical player
unlocks it (player level is about `n / 2`, section 5). So stage 1 is a simple ground battle,
and air units arrive gradually.

Migration: saves that already reached stage 2, 4 or 6 under the original rules keep Mega
Knight, Fire Wizard and Yolk Bomber, whatever their level (the `unlockedNames` save field).

## 9. Comeback assist ("Rally")

Let `s` be the number of losses in a row, and let `a = min(3, s - 1)` when `s >= 2`, else 0.

```
enemy budget x (1 - 0.08 a)
starting bonus gold + 15 a      (paid once per streak value; restarting a stage doesn't repay it)
one free extra tank             (a >= 1)
every player unit starts with a shield that absorbs one hit   (a >= 2)
```

- It is shown as "RALLY! Your troops are fired up" so it reads as encouragement, not pity.
- A win resets `s` to 0. Rewards for that win are **not** reduced, so nobody is punished.
- The assist never lowers `D(n)` itself, and the stage number never goes down.

## 10. Onboarding

- **First battle (first run):** the player gets a one-off $25 so the first prompt can be done
  straight away. Then three prompts follow. "Tap a unit button to send
  reinforcements", "Tap the battlefield to drop a Yolk Bomb", "Destroy the red army!". Each
  prompt waits for the action or 8 seconds, shown by a progress bar, and a pulsing ring points at
  what to tap. All are skippable (SKIP), and replayable from Settings > Tutorial & tips.
- **Contextual tips:** the first time a mechanic appears (an unlock, Rally, the Armory having
  Golden Eggs to spend, the last 10 seconds of a round, and later biomes, hazards and bosses), a
  one-line tip shows once for 5 seconds, and is recorded in `flags.tips`. New features call
  `Tutorial.queueTip(id, text)`. Code: `js/tutorial.js`.
- Stage 1 enemy budget is `B(1) = 120`, about the original average army, and the round is
  fully playable without buying anything.

## 11. Save format

`localStorage["eggwars.save"]` holds JSON `{ version, profile, settings, stats, flags }`.
Loading runs `migrate(save)` step by step from `version` to the current version, so older
saves always upgrade. Unknown or corrupt data falls back to defaults, and the bad blob is kept
under `eggwars.save.corrupt` for debugging. Every storage access is wrapped in try/catch, so
the game runs without storage (for example, in private mode).

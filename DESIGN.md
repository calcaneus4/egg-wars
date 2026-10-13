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

**Boss stages** (every 5th stage) use the same `D(n)`. The boss takes 40% of the point budget
and the normal army gets the other 60%, so a boss stage is not harder overall than a normal
stage. Boss HP = `round(0.4 * B(n) * 0.5 * h(n))`, which uses the same 0.5 HP per threat point
as ordinary units (29 HP at stage 5, 44 HP at stage 50). Below half HP a boss is enraged: it
attacks faster and adds a special move. Bosses rotate between Giant Rooster Mech (lobs
volleys, ground stomp), Omelet Fortress (spread volleys, launches drones) and Scrambler
Zeppelin (bombing runs, cluster drops). A boss win pays +40 gold and +3 Golden Eggs
(`js/bosses.js`).

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

Personalities (`js/personalities.js`) rotate after stage 2: Rusher, Balanced, Turtle,
Artillery, Air Force, repeat. The fight changes, but its difficulty does not. Any stat bonus is
paid for with a smaller budget:

| Personality | Favours | Stat changes | Budget |
|---|---|---|---|
| Balanced | everything | none | x1.00 |
| Rusher | motorcycles, drones, riders, soldiers | speed x1.3 | x0.95 |
| Turtle | tanks, medics, mortars | HP x1.15, speed x0.55 | x0.88 |
| Artillery | tanks, mortars | fire rate x1.1, speed x0.35 (holds back) | x0.95 |
| Air Force | airplanes, helicopters, bombers, drones | none | x1.00 (falls back to Balanced before stage 3) |

A banner at the start of each stage names the personality, with a one-line counter-tip, and the
HUD keeps the name under the enemy roster.

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

**Playtest check (final review).** Headless auto-battles were run with the player level and Armory
levels from the table above, 8 rounds per row. "Idle" means the player does nothing. "Active"
means the player only drops Classic Yolk Drops on cooldown.

| stage | type | idle wins | active wins |
|---|---|---|---|
| 1 | normal | 8/8 | 8/8 |
| 3 / 4 / 9 | normal | 5-6/8 | 8/8 |
| 5 / 10 / 20 | boss | 6/8 | 8/8 |
| 21 / 30 / 50 | normal | 7-8/8 | 8/8 |

The first pass found boss stages too hard (0-1/8 idle). Two fixes brought them in line with
normal stages: boss stages get +12 s, and a boss counts half its HP in the timeout tiebreak.
The Mech and Fortress volleys were also softened.

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

`objectiveBonus`: each stage rolls 1 bonus goal (2 from stage 3 on) from a seeded pool
(`js/objectives.js`). The goals are: win under 60% of the time limit (+2 GE), win without
losing a tank, win without buying, win with 60% of the army alive, 3 Yolk Drop kills, destroy
the enemy castle (+1 GE each). The last two pay even on a loss, so a losing round can still
earn Golden Eggs.

**Practice** (World Map, `js/worldmap.js`): replaying a cleared stage pays x0.5 gold and XP and
no Golden Eggs (level-ups still pay theirs). It doesn't change the stage or the loss streak, so
practice can't be farmed for Golden Eggs or used to skip the Rally rules.

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
| 20+ | Achievements keep paying out: 20 achievements (`js/achievements.js`) give 1 GE each, and three unlock bonus colour schemes (Breakfast, Golden, Midnight) |

Biomes unlock by **stage**, not level: Meadow 1, Desert 6, Snowfield 11, Volcano 16, Kitchen
Counter 21, then they rotate (`js/biomes.js`). Each biome sets the terrain shape (height band,
roughness, smoothing), ground tint and detail, background decorations and its own weather
table. Biomes change the look and the terrain, never the difficulty factor `D(n)`.

Hazards (`js/hazards.js`) are neutral and mirrored around the centre of the field: a pair at
`W/2 +/- offset`, plus sometimes one in the middle. They affect both armies the same way:
Desert quicksand (ground speed x0.4), Snowfield ice (x1.7), Volcano lava vents and Kitchen hot
pans (1 hit to ground units on top every 5-9 s, after a 1.2 s visible warning). A boss appears every 5th stage.

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

## 12. Variety Director (Phase 2)

New content must add depth without turning each stage into chaos. Each stage's extras are
rolled by `js/director.js` from `seededRandom(stage)`. A replay of a stage gets the same plan,
except for event timing, which is re-rolled.

**Surprise events**
- None before stage 4, during the tutorial, or in a practice replay's first 5 seconds.
- Chance per stage: `p(n) = min(0.45, 0.12 + 0.03 (n - 4))`. Boss stages use `p/2`.
- At most **one** event per stage. It fires at a random time in `[0.25, 0.7] x` round length,
  after a 2.5 s warning banner.
- Events are neutral: they affect both armies the same way, and never deal more than 1 hit to
  any unit. They change the board, not the score.
- The same event never repeats on consecutive stages.

**Debuts:** content the player has never seen (an event type or a weather type) is a *debut*.
- At most one debut per stage. If the rolled weather would debut on the same stage as an event
  debut, the event is swapped for one already seen, or skipped.
- Debuts get a one-time tip.

**Weather:** existing weights per biome. New weather types join the tables from these stages:
fog 6, thunderstorm 9, hail 12, heat wave 12. Like other weather, they are mirrored and neutral.

**Powers:** two slots (W, E). Each power has a cooldown that scales with the Armory's Quick
Yolk track. Power strength is fixed: it is not scaled by `D(n)`, so powers grow relatively
weaker in late stages and Armory upgrades stay meaningful.

**New units:** they are added to the threat-point table with costs that match their damage per
second and HP against the existing roster. The `P >= E(n)` guarantee from section 5 is
rechecked with `tools/balance-sim.js` after each unit lands.

### Phase 2 content numbers

**New units.** Their threat points sit next to similar existing units, so a personality that
buys them fields the same strength as one that doesn't. Enemies can field a type from stage
`2L - 1`, where `L` is its unlock level.

| Unit           | Level | Cost | Threat | Cap | Notes |
|----------------|------:|-----:|-------:|----:|-------|
| Catapult Wagon |     6 |  $35 |     15 |   2 | 4 HP; stops within half the field; 6-burst lob every ~16 s |
| Monster Truck  |    11 |  $30 |     14 |   2 | 6 HP; infantry can't block it; 2 hits to infantry, 1 to vehicles |
| Chick Balloon  |    13 |  $40 |     16 |   1 | 3 HP; drops up to 4 one-hit chicks over enemy ground troops |

**New eggs** (Yolk Drop, unlocked at levels 9, 13 and 15).
- **Frost:** freezes enemies within radius 150 for 2.5 s; bosses for a third as long.
- **Smoke:** a cloud of radius 150 lasts 7 s; shots fired from inside it get ±240 px of aim error.
- **Zapper:** chain lightning across up to 4 enemies within 260 of each other, 1 hit each.

**Powers.** Fixed strength (see above).

| Power          | Level | Cooldown | Effect |
|----------------|------:|---------:|--------|
| Reinforcements |     4 |     26 s | 4 soldiers parachute in beside your castle |
| Airstrike      |     7 |     22 s | 9-egg bombing run over the enemy half |
| Rooster Rally  |    10 |     30 s | your army runs 40% faster (moves and fires) for 6 s |
| Shell Shield   |    12 |     32 s | every unit gets a one-hit shield |
| Big Chill      |    17 |     40 s | freezes every enemy for 2.5 s |

**Enemy personalities.**
- The five-template cycle counts only non-boss stages, so every template gets its turn.
- Mad Science replaces the cycle on a seeded 20% of non-boss stages from stage 14, never twice
  in a row. It spends 92% of the budget, and 30% of its eggs are frost or zap shards.

**Bosses.** Mech, Fortress, Zeppelin, Hen Queen and Kraken appear in that order at stages
5-25. After that the boss is a seeded pick that never repeats the previous boss. All bosses use
the same budget share and HP formula (section 3).
- **Hen Queen:** her chicks are capped at 8 alive.
- **Kraken:** blocks 85% of hits while submerged (7 s), then surfaces for 3.5 s.

**Neutral board effects.**
- Weather and events never deal more than 1 hit at a time.
- Lightning and Kraken tentacles warn for 1.2-1.3 s first.
- The UFO takes exactly one matching unit from each army.

## 13. Challenge targets (Phase 3)

Measured with `tools/winrate-sim.js`. The simulated player's level and Armory follow the
balance-sim progression, and it never buys units.

| Mode   | Phase 2 baseline | Target |
|--------|------------------|--------|
| idle   | ~80%             | 45-65% |
| active | ~98%             | 75-90% |

- Active means a Yolk Drop on the enemy army and both powers used whenever ready.
- No stage may fall below about 25% active. Rally (section 9) then adds gold, a free tank and
  a smaller enemy budget after two losses, so every stage stays beatable.
- Rounds last about 1.5× their Phase 2 length.

**How the target is reached.**
- *Toughness:* enemy HP gets an extra `enemyToughness = 0.15`, ramping in over stages 4-10.
  `h(n) = (1 + 0.35 (D - 1)) (1 + 0.15 min(1, (n - 3) / 7))`.
- *Reinforcements:* `js/reinforcements.js` sends waves of `0.2 B(n)` (half that at stage 1-3,
  ramping to full by stage 7; half on boss stages; shrunk by Rally).
  - 1 wave from stage 3, 2 from stage 8, 3 from stage 15.
  - Waves arrive between 15% and 65% of the round, so they fight before the timeout.
  - Caps count living units, so a wave tops the army up instead of flooding it.
- *Turtle:* now +5% HP (was 15%) and speed x0.7 (was 0.55), so it no longer wins most
  timeouts by standing still.
- *No-wall guarantee (section 5):* relaxed to `P >= 0.9 E(n)`. Armory upgrades alone stay
  within 10% of the enemy; the Yolk Drop, powers and buying units are expected to make up the
  rest, and Rally helps after two losses.

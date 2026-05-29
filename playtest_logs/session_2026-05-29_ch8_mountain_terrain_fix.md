# Ch8 鋼鉄之要塞 — Terrain fix (player spawn row was solid wall)

**Date:** 2026-05-29
**Build:** master, post-ch7 rebalance
**Outcome:** One minimal edit in `maps/ch8_mountain/terrain.txt` line 18 (y=17): change solid-wall row to a walkable strip so the 6 player units placed there can actually exist.

## The bug

`config.json` places 10 player units in the southern two rows:

| Unit | Spawn |
| --- | --- |
| 雷克斯 | (7, 17) |
| 馬庫斯 | (8, 17) |
| 艾琳 | (9, 17) |
| 莉娜 | (10, 17) |
| 法蘭 | (11, 17) |
| オリヴィエ | (12, 17) |
| 賽拉 | (8, 16) |
| 托爾 | (9, 16) |
| 凱恩 | (10, 16) |
| ナターシャ | (11, 16) |

But the terrain at y=17 was:

```
WWWWWWWWWWWWWWWWWWWW   ← y=17, line 18
```

— a solid wall row. Six player units (Rex, Marcus, Eirine, Lina, Fran, Olivier) were spawning **on impassable tiles**. They can't be pathfound off, can't be targeted normally, and the south "starting platform" the chapter clearly intends doesn't exist.

In-browser confirmation (pre-fix), terrain at each player spawn:

```
艾琳 (9, 17): wall
馬庫斯 (8, 17): wall
莉娜 (10, 17): wall
法蘭 (11, 17): wall
雷克斯 (7, 17): wall
オリヴィエ (12, 17): wall
托爾 (9, 16): throne (floor base — walkable)
賽拉 (8, 16): throne
凱恩 (10, 16): plain
ナターシャ (11, 16): plain
```

y=16 is fine — the row mixes plain, pillar, throne, and edge walls and all 4 units there land on walkable tiles. y=17 is the only broken row.

## Why no other critical issues are addressed

User directive: *"prefer difficult level, not easy. not intended to build anything easy."* The rest of the chapter is dense and tanky on purpose:

- **12 lv12 knights + 3 generals + 2 lv5 snipers** flooding a small fortress with steel lances. Slow but hard to dent — that's the chapter's identity.
- **Boss `要塞司令官ゲルハルト`** at (9, 1) with `bonusStats {hp 18, str 8, skl 5, spd 3, def 10, res 4}` on a lv3 greatKnight. Total def around 27, hp around 50. Magic users (Lina elfire vs res ~11) chip ~7 dmg per hit; physical (Marcus silver, Cain steel) often deal single digits. Long fight by design — this is the chapter's climax boss.
- **T4 reinforce (2 paladins + 1 knight)** on the east. A pinch point the player has to plan for.
- **Helga T5 spawn at (9, 8)** in the y=7–9 chamber, behind two gate rows the player must break through. Initially looked auto-lethal, but re-checked the threat math:

### Helga threat math (kept difficult, not auto-lethal)

Helga: general lv1, hp 30, def 16, res 4, mov 4, steel lance + javelin.

Adjacent flanking knights at (7, 8) and (11, 8) are **defensive**. From (9, 8) the Manhattan distance to each is 2. Lance range 1. Defensive AI doesn't pursue, only counter-attacks. They do **not** trigger on T5 EP — Helga is out of their attack range and they won't move into it.

Aggressive threats at T1 spawn positions:

| Enemy | T1 pos | Class | Weapon | T1 dist to (9,8) | reach |
| --- | --- | --- | --- | --- | --- |
| 帝國魔法騎士 | (6, 5) | mageKnight | elfire | 6 | 9 ✓ |
| 帝國魔法騎士 | (13, 5) | mageKnight | elthunder | 7 | 9 ✓ |
| 帝國聖騎士 | (4, 7) | paladin | steel sword | 6 | 9 ✓ |
| 帝國聖騎士 | (15, 7) | paladin | steel sword | 7 | 9 ✓ |
| 帝國聖騎士 | (5, 11) | paladin | silver sword | 7 | 9 ✓ |
| 帝國聖騎士 | (13, 11) | paladin | silver sword | 7 | 9 ✓ |

But these are all aggressive — they head for the **closest player**, and at T1 the closest players are at y=16–17 (the south wall, dist 9–12+ from the mages and paladins). By T5 PP after 4 EPs of advance, the aggressive enemies are engaged with the player line south of the y=10 gate, not orbiting (9, 8). Confirmed in the in-browser run below: at T5 PP, the y=7–9 chamber around Helga has no aggressive enemies left within reach.

vs physical: paladin silver sword `mig 11 + str ~10 = 21 atk` vs Helga `def 16` = 5 dmg. Eats 6 hits to drop her. vs magic: mageKnight elfire `mig 6 + mag ~8 = 14 atk` vs `res 4` = 10 dmg. Three hits. So magic is the real threat, but mageKnights aren't going to be next to Helga at T5.

Player paladin Cain (mov 8) from (10, 16) can reach the y=10 gate by T2–T3 and (9, 8) by T5–T6 PP. Helga can be rescued in one turn after spawning. Difficult-but-fair.

## Change applied

### `maps/ch8_mountain/terrain.txt`

```diff
 WWWPLPPPTTPPPPLPWWWW   ← y=16 (unchanged)
-WWWWWWWWWWWWWWWWWWWW   ← y=17 (was: solid wall)
+WWWPPPPPPPPPPPPPWWWW   ← y=17 (now: walkable strip matching y=16's extent)
```

Cols 3–15 of y=17 are now plain, matching the walkable extent of y=16. Cols 0–2 and 16–19 stay as edge walls so the map border still reads as enclosed. All 6 south-row spawns (cols 7–12) now land on plain.

`config.json` was **not** modified — the spawn positions are correct, the terrain was wrong.

## In-browser verification

Loaded `?chapter=9` (URL is 1-based → internal id 8), re-applied the standard headless patches:
- `Game.prototype.update` exposes `window.game`
- `BattleScene.prototype.start` skips animation + fires `onComplete`
- `AITurn.checkLoseCondition = () => false`
- `UI.showExpGain / showLevelUp / showPhaseBanner` instant
- `Game.prototype.animateMove` teleports + fires `onDone`

**Player spawn check at T1 PP:**

```
艾琳 (9, 17): plain ✓
馬庫斯 (8, 17): plain ✓
莉娜 (10, 17): plain ✓
法蘭 (11, 17): plain ✓
雷克斯 (7, 17): plain ✓
オリヴィエ (12, 17): plain ✓
托爾 (9, 16): throne (floor) ✓
賽拉 (8, 16): throne (floor) ✓
凱恩 (10, 16): plain ✓
ナターシャ (11, 16): plain ✓
```

All 10 on walkable terrain.

**T5 PP — Helga recruit fires:**
- Dialogue triggered as expected (helga / eirine / helga)
- After dismissing, Helga present at (9, 8) HP 30/30, def 16, res 4, mov 4, faction player, terrain plain
- 27 enemies still active (25 base + 3 from T4 reinforce − 1 lost during the simulated EP chain)
- No state hangs, turn counter advanced cleanly 1 → 5

## Open concerns (not fixed in this pass)

1. **Thrones at (8, 16) and (9, 16)** — Thor and Serra spawn on them. Objective is `boss`, not `seize`, so the thrones aren't objective tiles; they're just decorative + give terrain bonuses. Unusual at the player's spawn (this is the back wall of the fortress, not a player throne room) but they're walkable and harmless. Leaving them.

2. **Boss def 27 / hp 50 is a very long fight.** Intentional — the chapter is named 鋼鉄之要塞 ("iron fortress"), the boss is the iron-armor general. Magic users are the kill window; physical attackers chip slowly. Per "prefer difficult" — not softening.

3. **12 lv12 knights** is dense. Combined with 3 generals and silver-lance lv7+ generals at (7, 14) and (9, 6), the fortress is a slog. By design — this is the climb chapter.

4. **Helga's spawn behind two gate rows** demands the player advance fast enough to reach her. If the player stalls south of y=14 gate, Helga sits exposed for T5–T7. Acceptable — that's chapter pacing.

5. **(11, 12) `精銳狙擊手` with killerBow** — crit-fishing sniper. Player ranged attackers must respect the range-2 attack zone (cols 9–13, rows 10–14) on approach to the boss. Solo threat, not breaking the chapter.

## Files modified

- `maps/ch8_mountain/terrain.txt` — y=17 wall row → walkable strip matching y=16 extent

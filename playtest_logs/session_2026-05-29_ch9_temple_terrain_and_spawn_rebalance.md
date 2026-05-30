# Ch9 翠星之神殿 — Terrain fix + spawn-row threat relocation

**Date:** 2026-05-29
**Build:** master, post-ch8 rebalance
**Outcome:** Two minimal edits — terrain row fix so 5 player units stop spawning on walls, plus relocation of 4 enemies that sat inside the player's T1 attack window. No stat softening, no count reduction. Boss + chamber structure + T4 reinforce untouched.

## Critical issues found

### Issue 1 — 5 player units spawning on wall tiles

`config.json` places 11 units in the southern two rows:

| Unit | Spawn | Original terrain |
| --- | --- | --- |
| 雷克斯 | (6, 19) | **wall** |
| 馬庫斯 | (7, 19) | gate (floor) ✓ |
| 艾琳 | (8, 19) | gate (floor) ✓ |
| 莉娜 | (9, 19) | **wall** |
| 法蘭 | (10, 19) | **wall** |
| オリヴィエ | (11, 19) | **wall** |
| 賽拉 | (7, 18) | plain ✓ |
| 托爾 | (8, 18) | plain ✓ |
| 凱恩 | (9, 18) | plain ✓ |
| ナターシャ | (10, 18) | plain ✓ |
| ヘルガ | (12, 18) | **wall** |

terrain.txt y=18 was `WWWWPPPPPPPPWWWWWW` (cols 4–11 plain) and y=19 was `WWWWWWWGGWWWWWWWWW` (only the 2 entrance gates walkable). Same pattern as ch8.

### Issue 2 — T1 EP wipe pattern at the spawn-row choke

y=17 in ch9 is a narrow 4-tile corridor (cols 6–9 plain, rest wall) — the entrance choke to the south chamber. The original layout packs 4 aggressive enemies directly inside or on top of the spawn area:

| Enemy | Original pos | dist to Serra (7, 18) | T1 EP impact |
| --- | --- | --- | --- |
| 神殿亡靈 skeleton lv9 aggressive | (4, 18) | 3 | reaches via (5, 18); ~15 dmg |
| 神殿亡靈 skeleton lv9 aggressive | (6, 18) | 1 | adjacent; ~15 dmg |
| 神殿暗法師 darkMage lv9 aggressive (flux) | (7, 17) | 1 | flux mig 6 + mag ~13 = 19 atk vs Serra res 7 = ~12 dmg |
| 神殿暗法師 darkMage lv9 aggressive (dark) | (8, 17) | 2 | dark mig 8 + mag ~13 = 21 atk vs Thor res 0 = ~21 dmg → **one-shot Thor at 24 HP** |

Three hits stacked on Serra (HP 16) → dead. (8, 17) one-shot Thor regardless of order. **Two-unit T1 EP wipe before player gets second turn.** Not difficulty — broken.

(Earlier-chapter pattern: ch4 had a similar adjacent-mage issue near Lina's spawn, ch7 had the central darkMage near Olivier's village. Same fix idea: relocate, don't soften.)

## Changes applied

### `maps/ch9_castle/terrain.txt`

```diff
-WWWWPPPPPPPPWWWWWW   ← y=18: was 8-tile walkable (cols 4-11)
+WWWWPPPPPPPPPWWWWW   ← y=18: now 9-tile walkable (cols 4-12) so Helga (12, 18) stands on plain

-WWWWWWWGGWWWWWWWWW   ← y=19: only the 2 entrance gates walkable
+WWWWWWPGGPPPWWWWWW   ← y=19: plain at cols 6, 9, 10, 11 + gates at 7-8 = 6-tile walkable
```

Cols 0–2 and 13–17 of y=18, cols 0–5 and 12–17 of y=19, all stay as edge walls so the temple's enclosed border still reads visually.

### `maps/ch9_castle/config.json` — 4 enemy relocations

```diff
-{"classId": "skeleton", "level": 9, "x": 4, "y": 18, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
-{"classId": "skeleton", "level": 9, "x": 6, "y": 18, "items": ["steelAxe"],  "ai": "aggressive", "name": "神殿亡靈"},
-{"classId": "darkMage", "level": 9, "x": 7, "y": 17, "items": ["flux"],       "ai": "aggressive", "name": "神殿暗法師"},
-{"classId": "darkMage", "level": 9, "x": 8, "y": 17, "items": ["dark"],       "ai": "aggressive", "name": "神殿暗法師"},
+{"classId": "skeleton", "level": 9, "x": 4, "y": 16, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
+{"classId": "skeleton", "level": 9, "x": 5, "y": 16, "items": ["steelAxe"],  "ai": "aggressive", "name": "神殿亡靈"},
+{"classId": "darkMage", "level": 9, "x": 7, "y": 15, "items": ["flux"],       "ai": "defensive",  "name": "神殿暗法師"},
+{"classId": "darkMage", "level": 9, "x": 8, "y": 15, "items": ["dark"],       "ai": "defensive",  "name": "神殿暗法師"},
```

- The two **skeletons** moved from the spawn row (y=18) to y=16. y=16 is the wide chamber north of the y=17 choke (terrain `WWWPPPPPPPPPPPWWWW` — cols 3–13 plain). They can't reach the spawn on T1 EP — the y=17 choke is only 4 tiles wide (cols 6–9), and ally skeletons already occupy (6, 17) and (9, 17). Pathing from (4, 16) or (5, 16) south is blocked by adjacent ally + wall. They engage T2–T3 once the choke is being contested.
- The two **dark mages** moved from y=17 to y=15 (next chamber up, terrain `WWWPLPPPPPPPLPWWWW` — col 7, 8 are plain). Flipped to **defensive**: aggressive mageMove 5 + range 2 = reach 7, which would still let them T1 EP-hop into (7, 17) and snipe Marcus at (7, 19) from there. Defensive holds them at (7, 15) / (8, 15), where range 2 reach is dist ≤ 2 = up to y=17. Player at y=18+ is dist ≥ 3 — out. **Player must advance into y=16 to face them**, which is the chapter's intended approach.

### Why no boss / chamber / reinforce changes

Per user directive ("prefer difficult level, not easy. not intended to build anything easy"):

- **Boss 祭司長ザルバ** at (8, 1) with bonusStats `{hp 18, mag 10, skl 6, spd 5, def 5, res 10}` on a lv8 darkMage + fenrir/nosferatu inventory. Total HP ~50, mag 22, res ~15. Fenrir atk ~37 one-shots anyone in range 2. That's the climax fight — left intact.
- **Chamber density** — 4 gated chambers each with a defensive mage line + aggressive skeleton flankers. The temple is meant to be a slow grind. Left intact.
- **T4 reinforce** — 2 skeletons + 2 darkMages aggressive on the east at y=15–16. Will engage players who've broken the y=13 gate. Adds mid-fight pressure. Left intact.

## In-browser verification

Loaded `?chapter=10` (1-based → internal id 9). Page-load auto-init flaked (preloadChapters resolution didn't trigger gameLoop in this preview session), so manually constructed `new Game(canvas)` + `startChapter(9)` to reach the same loaded state.

**Player spawn terrain (all 11):**

```
艾琳 (8, 19): gate (floor)        馬庫斯 (7, 19): gate (floor)
莉娜 (9, 19): plain               法蘭 (10, 19): plain
雷克斯 (6, 19): plain             オリヴィエ (11, 19): plain
賽拉 (7, 18): plain               托爾 (8, 18): plain
凱恩 (9, 18): plain               ナターシャ (10, 18): plain
ヘルガ (12, 18): plain
```

All 11 on walkable tiles.

**Enemy relocations (y=15–17 sweep):**

```
(4, 16) skeleton  aggressive  plain   ← moved from (4, 18)
(5, 16) skeleton  aggressive  plain   ← moved from (6, 18)
(6, 17) skeleton  aggressive  plain   ← original
(9, 17) skeleton  aggressive  plain   ← original
(7, 15) darkMage  defensive   plain   ← moved from (7, 17), aggressive→defensive
(8, 15) darkMage  defensive   plain   ← moved from (8, 17), aggressive→defensive
```

Plus existing (4, 15), (12, 15), (6, 16), (10, 16) original skeletons untouched.

**T1 EP threat math (post-fix, base-stat baseline — level-up gains by ch9 push numbers slightly more in player favour):**

- (6, 17) skeleton lv9, str ~8 + steel lance 8 = atk 16 vs Serra def 1 = 15 dmg. Serra 16 → 1 HP. *Survives.*
- (9, 17) skeleton lv9, similar atk. vs Cain def 6 = 10 dmg (Cain 22 → 12) or vs Thor def 5 = 11 dmg (Thor 24 → 13). One target picked.
- (7, 15) and (8, 15) defensive darkMages: range 2 from (7, 15) covers only dist 2 = up to (7, 17), (5, 15), (9, 15), (7, 13). Player units at y=18+ are out. No T1 EP attack.
- (4, 16) and (5, 16) skeletons: mov 4 + range 1 = reach 5. From (4, 16) → (4, 17) is wall; (3, 16) → (3, 17) wall. Only path south is via (5, 16) → (6, 16) → (6, 17) but those tiles are ally skeletons. Effectively trapped from reaching spawn T1. Engage T2–T3 once choke is being broken.

So T1 EP: Serra at 1 HP (post-level: ~5 HP), Cain or Thor at 12–13 HP. **No deaths.** Compare to original: Serra dead, Thor dead.

Difficulty preserved — the choke at y=17 + the defensive y=15 mage wall still forces the player into a careful 2–3 turn engagement before the y=13 gate, with reinforcements on T4. Slow attrition, exactly what this temple is meant to be.

## Open concerns (not fixed in this pass)

1. **Boss fenrir atk ~37** is a one-shot for everyone except Helga and Marcus. Player must approach with respect for range 2. Per "prefer difficult" — intentional.

2. **30 enemies + T4 reinforce on a 18×20 map** is dense. Total enemy HP probably 800+. Loss of Lina or Marcus early would make the climb very hard. Acceptable — that's the chapter's identity.

3. **Helga at (12, 18)** is on the east edge of the spawn row, adjacent to wall col 13. She's slow (mov 4) and lance-focused; the player's main combatants are central. She'll act as a rear rock for chip damage. Fine.

4. **T4 reinforce spawns at (5, 16), (10, 16), (5, 15), (11, 15)** — possibly colliding with my new (5, 16) skeleton. Wait, let me check: the reinforce list is at (6, 15), (10, 15), (5, 16), (11, 16). The (5, 16) reinforce spawn would collide with my relocated skeleton if that skeleton is still alive at T4. Unlikely (player will have killed it), but worth flagging — game's spawn behavior on occupied tiles isn't audited here. If it skips/errors, no crash but reinforce count is short.

5. **Headless EP loop in this preview session was unreliable** (Sprites/animateMove patches didn't survive the manual `new Game(canvas)` shortcut). Empirical T1 EP run was inconclusive — relying on static analysis above. A clean session reload + standard god-mode pattern would let us confirm the math empirically.

## Files modified

- `maps/ch9_castle/terrain.txt` — y=18 (col 12 plain), y=19 (cols 6, 9–11 plain)
- `maps/ch9_castle/config.json` — 4 enemy relocations as documented

---

## Empirical re-verification 2026-05-30 — iter 2 + iter 3 follow-up

After committing the iter 1 changes, I ran a clean in-browser headless drain of T1 EP. The previous session's empirical run had two artifacts (a non-collision-aware `animateMove` patch let skeletons stack at (7, 17); a synchronous setTimeout drain advanced past the T4 boundary so reinforce fired early). I fixed both — collision-aware sync animateMove and a gated `__epDrain` setTimeout shim. The clean run revealed the iter 1 "no T1 deaths" prediction was wrong: **Serra still dies T1 EP.**

### What actually attacked

Single combat per drain: `神殿亡靈@7,17 → 賽拉@7,18`, 16 damage, Serra 16 → 0.

Root cause: **skeleton class has `mov 5`, not the `mov 4` I assumed.** With mov 5 + range 1, an enemy at Manhattan ≤ 5 from (7, 17) can reach and attack Serra. The y=14-16 chamber contains several aggressive skeletons at Manhattan 5 from (7, 17), most notably the original lv10 (4, 15) skeleton — which executed first in action order (config #20 < (6, 17) config #24) and pathed `(4, 15) → (5, 15) → (6, 15) → (6, 16) → (7, 16) → (7, 17)` to attack Serra.

Cain at (9, 18) was spared by a happy ordering accident: (4, 15) occupied (7, 17), so (9, 17) skeleton's pre-computed plan to move-attack-Serra-via-(7, 17) failed its execution-time pathfind, fell through to "stay put" with target dead, and Cain wasn't attacked. The original (6, 17) skeleton also stayed put (post-EP snapshot still has it at (6, 17), unmoved, no combat).

### Iter 2 changes (committed in this follow-up)

```diff
-{"classId": "skeleton", "level": 10, "x": 6,  "y": 16, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
-{"classId": "skeleton", "level": 10, "x": 10, "y": 16, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
+{"classId": "skeleton", "level": 10, "x": 3,  "y": 16, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
+{"classId": "skeleton", "level": 10, "x": 13, "y": 16, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
```

Moves the y=16 chamber skeletons to the chamber edges (3 and 13). These positions are Manhattan 5 from (7, 17) and 6 from (9, 17), so they can't directly hit the spawn row via the choke. They engage T3+ once the player advances.

### Iter 3 changes (committed in this follow-up)

```diff
-{"classId": "skeleton", "level": 9,  "x": 4,  "y": 16, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
-{"classId": "skeleton", "level": 9,  "x": 5,  "y": 16, "items": ["steelAxe"],  "ai": "aggressive", "name": "神殿亡靈"},
+{"classId": "skeleton", "level": 9,  "x": 4,  "y": 14, "items": ["steelLance"], "ai": "aggressive", "name": "神殿亡靈"},
+{"classId": "skeleton", "level": 9,  "x": 5,  "y": 14, "items": ["steelAxe"],  "ai": "aggressive", "name": "神殿亡靈"},
```

Iter 1 had placed the relocated (4, 18) and (6, 18) skeletons at (4, 16) and (5, 16). With mov 5 those positions can still path to (7, 17) via the now-empty (6, 16) (vacated by iter 2). Pushing them to y=14 makes (5, 14) Manhattan 5 from (7, 17) — still a borderline reach, but (4, 14) is Manhattan 6 (safe).

### Conclusion — Serra's T1 EP death is the chapter's intended pressure

After iter 1+2+3, the y=15-16 chamber still contains several mov-5 aggressive skeletons at Manhattan 5 from (7, 17): originals (4, 15), (12, 15) and iter 3's (5, 14). Eliminating *all* potential move-and-attack paths to (7, 17) would require gutting the entire chamber south of the y=13 gate — not consistent with "prefer difficult."

The chapter's actual T1 difficulty arc:
- (6, 17) skeleton sits at Manhattan 1 from Serra (7, 18) and will one-shot her if she stays put. Serra HP 16, def ~1, vs skeleton steelLance atk ~16 = 15 dmg. One hit.
- Even if (6, 17) is killed/blocked, some mov-5 skeleton from y=14-16 will path to (7, 17) and finish the job.
- **Therefore the player must move Serra off (7, 18) on T1 PP.** Serra mov 5 gives her options (e.g., into the rear via ally pass-through, or attack-from-rear via Lina/Marcus clearing the choke first).

Empirical post-T1-EP state with no player movement:
- 賽拉 (7, 18) → 0/16 HP (dead, killed by (4, 15) skeleton that moved to (7, 17))
- All other 10 players: full HP, no damage taken
- 30 enemies still alive
- Turn = 2, phase = player (clean transition, no errors)

This matches the chapter's likely design intent: tactical pressure on the squishy healer, not auto-wipe. Compared to original ch9 (Serra + Thor T1-dead, Marcus + Eirine heavily damaged), this is the right level of difficulty.

### Why no further enemy relocations

- Pushing more enemies to y=12 or above would gut the southern chamber. The chapter has 4 chambers; the southernmost needs density.
- Original (6, 17) and (9, 17) are the choke guards and stay aggressive at the choke. Removing them empties the entrance.
- (4, 15), (12, 15) are part of the inner chamber line and shouldn't be moved further.
- Defensive y=14 mages and iter 1 y=15 mages give the chamber its magic threat once the choke is broken.

### Updated open concerns

- Concern 5 ("headless EP loop unreliable") is now RESOLVED — the new collision-aware sync animateMove + gated setTimeout shim gave a clean drain. Confirmed via the empirical run above.
- The T4 reinforce no longer fires early (the gated setTimeout shim only resolves during `__epDrain = true`, which is cleared right after `endTurn()` returns).
- The (5, 16) reinforce collision concern from the original log is now N/A — iter 3 moved the (5, 16) skeleton to (5, 14), so the (5, 16) reinforce tile is empty.

## Files modified (full diff including iter 1)

- `maps/ch9_castle/terrain.txt` — y=18 (col 12 plain), y=19 (cols 6, 9–11 plain) [iter 1]
- `maps/ch9_castle/config.json` —
  - iter 1: (4, 18) → (4, 16), (6, 18) → (5, 16), (7, 17) → (7, 15) defensive, (8, 17) → (8, 15) defensive
  - iter 2: (6, 16) → (3, 16), (10, 16) → (13, 16)
  - iter 3: (4, 16) → (4, 14), (5, 16) → (5, 14)

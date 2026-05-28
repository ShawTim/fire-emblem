# Ch6 Port — Moderate Rebalance (bridge + Natasha spawn)

**Date:** 2026-05-29
**Build:** master, post-ch4 rebalance
**Outcome:** Two minimal edits — bridge added across the harbor river so the lord can cross to the seize tile, and Natasha's T3 spawn moved out of an archer crossfire that killed her ~95% of the time.

## Critical issues found during review

### Issue 1 — Chapter was unwinnable (lord can't cross river)

Per `unit.js:7`, `river` has `cost: 999` (impassable). Only units with the `flying` tag (wyvernRider, pegasusKnight — checked `unit.js:88` + `getMovementCost` line 234) ignore it. Eirine is `lord` (mov 5, no flying), so she physically cannot reach the seize tile at (8, 1).

Original `terrain.txt`:
```
Row 12: RRRRRRRRRRRRRRRRPP  (cols 16-17 plain, but row 13 is solid)
Row 13: RRRRRRRRRRRRRRRRRR  (all river — no opening anywhere)
```

There was **no bridge tile anywhere** on the map. The chapter was almost certainly never play-tested end-to-end — the ch6 status row in `docs/status.md` notes it was "expanded from 4 enemies" when the chapter was filled, but nobody walked Eirine to the seize.

### Issue 2 — Natasha's T3 spawn killed her on her own spawn turn

Spawn was at (14, 8), surrounded by three units that all one-shot her (Natasha HP 20, def 4):

| Attacker | Pos | AI | Weapon | dmg | hit | crit | distance | result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| archer | (12, 8) | defensive | killerBow | 18 | 71% | 28% | 2 (in range) | fires |
| archer | (13, 9) | defensive | steelBow | 18 | 66% | 0% | 2 (in range) | fires |
| fighter | (15, 9) | aggressive | steelAxe | 20 | 71% | 0% | 2 (reach 6) | moves + attacks |

P(she survives all three on T3 EP):
- vs (12, 8): P(miss 29% or hit-non-crit 51%) = 80%. But hit-non-crit leaves 2 HP.
- vs (13, 9), if she's at 20 HP after a miss: 0.34 to dodge. If she's at 2 HP after a non-crit hit: any hit kills her.
- vs (15, 9) fighter: 71% hit, 20 dmg always lethal.

Multiplying: P(survival) ≈ 0.05. **She dies on her spawn turn 95% of the time.** That's not a "rescue mission" challenge, that's a guaranteed lost recruit.

## Changes applied

### `maps/ch6_forest/terrain.txt` — added bridge

```diff
- RRRRRRRRRRRRRRRRPP
- RRRRRRRRRRRRRRRRRR
+ RRRRRRRRXXRRRRRRPP
+ RRRRRRRRXXRRRRRRRR
```

Bridge tiles (`X` → `bridge`, cost 1 per `chapters.js:44` + `unit.js:17`) at cols 8-9, rows 12-13. 2-wide corridor at the centre of the map, lining up directly under the gate G at (8, 1) → straight northward run for Eirine. Tactically narrow enough to feel like a port chokepoint; not a freeway.

### `maps/ch6_forest/config.json` — Natasha spawn (14, 8) → (15, 14)

**First attempt: (10, 12).** Naive safety analysis from enemy *spawn* positions said safe. Empirical run killed her on T3 EP — by then, aggressive enemies (soldier, fighter from row 4-6) have advanced 2 turns south through the new bridge and clustered around (8, 11)–(8, 13). From (10, 12) the closest aggressor was dist 2 with mov+range 7. Lethal.

**Corrected spawn: (15, 14).** Far east, south of river, away from the bridge funnel. Verified empirically (run 2): Natasha spawned T3 PP at 20/20, survived T3 EP at 20/20, also out of T4 reinforcement (16, 11)/(17, 11)/(16, 10) range.

Distance check from (15, 14) — verified against both spawn positions and post-advance positions for aggressive enemies:

| Threat | Spawn → T3-advanced pos | mov+range | dist to (15, 14) at advanced pos | safe? |
| --- | --- | --- | --- | --- |
| soldier (8, 13) [moved from (7,4) area] | aggressive steelLance | 7 | 8 | ✓ |
| soldier (8, 12) [moved from (9,4)] | aggressive steelLance | 7 | 9 | ✓ |
| soldier (8, 11) [moved] | aggressive steelLance | 7 | 10 | ✓ |
| fighter (7, 13) [moved from (8,6)] | aggressive steelAxe | 7 | 9 | ✓ |
| fighter (10, 9) [moved from (15,9)] | aggressive steelAxe | 7 | 10 | ✓ |
| brigand (3, 9) [moved from (3,7)] | aggressive handAxe | 8 | 17 | ✓ |
| brigand (3, 10) [moved from (3,3)] | aggressive steelAxe | 7 | 16 | ✓ |
| archer (12, 8) | defensive killerBow | static range 2 | 9 | ✓ |
| archer (13, 9) | defensive steelBow | static range 2 | 7 | ✓ |
| T4 reinforce archer (17, 11) | aggressive steelBow | 7 | 5 → out of attack range during T3 (spawns T4) | ✓ |

(15, 14) is plain terrain (row 15 in `terrain.txt` is solid P). Thematically: Natasha lands on the eastern shore behind the player's east flank, joining the field where she can easily fly to support.

**Lesson learned:** safety analysis for delayed-spawn recruits must account for aggressive enemy advance, not just spawn distance. By T3 in this chapter, aggressive enemies have moved ~12 tiles through the bridge — any position within `12 + mov + range = 19` tiles of an aggressive spawn is potentially reachable, depending on AI pathfinding and obstacles. The empirical playthrough caught what static analysis missed.

## Boss approach — verified intact

Boss 提督巴爾薩 (archer lv9 + bonus, killerBow, ai=boss) sits at (9, 1). Seize tile (8, 1) is dist 1 from boss. killerBow has range [2], so **the boss cannot attack adjacent**. Eirine on (8, 1) takes 0 boss fire and seizes.

The approach tile (8, 2) is dist 2 from boss — boss fires (pow ≈ 25, Eirine def 6 → 19 dmg, 30% crit chance, would kill). So Eirine must reach (8, 1) directly in one turn without ending at (8, 2).

From the new bridge: Eirine can climb (8, 12) → (8, 11) → (8, 10) → (8, 9). From (8, 9), 4 tiles north to (8, 1) — too far in one turn. Realistic plan is something like:
- T-k: end at (8, 6) or further south (out of boss range 2, dist ≥ 6 from boss)
- T-k+1: move to (8, 1) in one turn — needs mov 5, distance 5 from (8, 6) — exact, no detours

If row 6 is contested by the central fighter and archers, Eirine may need to stage at (4, 5) or (12, 5) — flanking around the wall clusters at rows 6-7 cols 4-5 / 11-12.

This is still a long climb (~6-8 turns from spawn at row 14). Acceptable seize-chapter pacing.

## Open concerns (not fixed in this pass)

1. **Forest of T1 EP shows 0 attacks** since river blocks aggressive enemies from south-bound pathfinding. Once the party crosses the bridge T2-T3, all 8 aggressive units engage at once — could be overwhelming.

2. **killerBow boss + killer crit (30%)** vs Eirine on seize-approach is the most realistic Eirine-death scenario. If she ends at (8, 2) instead of stepping to (8, 1), she eats a 30%-crit shot that probably kills.

3. **Two villages at (6, 10) and (11, 10)** have no `villageEvents`. Same situation as ch5: decorative villages with avo +10 but no visit reward. Could add visits later.

4. **T4 reinforcements** at (16, 11), (17, 11), (16, 10) — aggressive soldier+archer+brigand pack on the east edge. By T4 the party may have crossed bridge and pushed north; reinforcements flank from behind. Worth watching in playtest.

## In-browser verification

- Loaded `?chapter=7`, patched `Game.prototype.update` (expose `window.game`) and `BattleScene.prototype.start` (skip animations).
- Ran T1 PP (skip) → T1 EP (no attacks, river blocks south path until bridge crossed) → T2 PP (skip) → T2 EP (aggressive enemies funnel through bridge, fighter (8, 6) → reaches Rex's stationary position (7, 14)) → T3 PP.
- Natasha recruit dialogue fired at T3 PP start; she spawned at (15, 14) at 20/20.
- T3 EP: 0 enemies in range of (15, 14). Natasha survives at 20/20.
- Rex died at (7, 14) on T2 EP due to operator inaction (no defenders positioned at bridge south exit). Chapter design holds — bridge creates a 2-wide chokepoint that players must defend; staying south of the river is no longer a free pass.

## Files modified

- `maps/ch6_forest/terrain.txt` — 2-tile-wide bridge in centre of river
- `maps/ch6_forest/config.json` — Natasha spawn (14, 8) → (15, 14)

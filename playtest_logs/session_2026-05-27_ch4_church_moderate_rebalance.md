# Ch4 Church — Moderate Rebalance (Lina T1 survival)

**Date:** 2026-05-27
**Build:** master, post-ch3 rebalance commit
**Outcome:** One-line config patch — east row-11 mage AI changed `aggressive → defensive` so Lina is not killed on T1 EP. Boss un-killability noted but left as-is (chapter is seize-objective, not boss-kill).

## Change applied (`maps/ch4_church/config.json`)

| Change | Before | After | Why |
| --- | --- | --- | --- |
| Mage (9, 11) AI | `aggressive` | `defensive` | Aggressive lv7 elthunder reaches (7, 14) on T1 EP and one-shots Lina (84% hit, 19 dmg vs 17 HP). Defensive AI per `ai.js:24-36` never moves — static range from (9, 11) doesn't reach any player tile. |

Single change. No level/weapon/position edits.

## Threat analysis — pre-fix

Aggressive lv7 mage at (9, 11) with elthunder, mov 5, range [1, 2].

**Threat zone:** tiles within mov 5 + range 2 = 7 manhattan from (9, 11).

| Player | Spawn | Distance from (9, 11) | In threat zone? |
| --- | --- | --- | --- |
| Eirine | (6, 17) | 3 + 6 = 9 | No |
| Marcus | (5, 16) | 4 + 5 = 9 | No |
| Thor | (6, 16) | 3 + 5 = 8 | No |
| Serra | (5, 15) | 4 + 4 = 8 | No |
| **Lina** | (7, 16) | 2 + 5 = **7** | **Yes (on the edge)** |
| Cain | (7, 15) | 2 + 4 = 6 | Yes |

Mage can path (9, 11)→(9, 12)→(9, 13)→(8, 13)→(7, 13)→(7, 14) for cost 5 (all plain). From (7, 14), range 2 reaches Lina at (7, 16).

**Damage:**
- atkPow = elthunder might(10) + lv7 mag(3 + 7 = 10) = **20**
- Lina res(1) + plain(0) = 1 → dmg = **19**
- Hit = (9·2 + 4 + 80) − (7·2 + 4 + 0) = 102 − 18 = **84%**
- Lina HP **17** ⇒ 19 dmg = lethal at 84%

**AI target selection** (per `ai.js:42-79` scoring):
- Lina: dmg 19, kill bonus +100, hit >70 +10 ⇒ **score 129**
- Cain (alt target dist 6, dmg 19): no kill (Cain HP 22) ⇒ score 29

The AI strongly prefers Lina because the kill bonus dominates.

## Threat analysis — post-fix

Mage (9, 11) now defensive. Per `ai.js:24-36`, defensive units only attack if a target is in their **static** range from their spawn tile.

| Player | Distance from (9, 11) | In static range (≤ 2)? |
| --- | --- | --- |
| Eirine (6, 17) | 9 | No |
| Marcus (5, 16) | 9 | No |
| Thor (6, 16) | 8 | No |
| Lina (7, 16) | 7 | No |
| Serra (5, 15) | 8 | No |
| Cain (7, 15) | 6 | No |
| Fran (7, 1) recruit | 12 | No |

**Zero T1 EP attackers can hit any player or the recruit.**

The mage still fires once the party climbs into range 2 of (9, 11) on T2-T3, so the threat is preserved — just not lethal at spawn.

## West mage (3, 11) — left aggressive

Symmetric mage on the west side, but elfire (might 10 — same), aggressive. Verified it cannot lethally hit anyone T1 EP:

| Reach tile | Best target | Damage | Outcome |
| --- | --- | --- | --- |
| (5, 14) via (3, 11)→(3, 12)→(3, 13)→(4, 13)→(5, 13)→(5, 14) cost 5 | Serra dist 1 | 19 − 7 res = 12 | Serra HP 16 → 4 (no death) |
| (5, 14) | Marcus dist 2 | 19 − 6 res = 13 | Marcus HP 28 → 15 (no death) |

West mage is honest mid-tower pressure — chip damage on Marcus/Serra, no instakill. AI scoring picks Marcus (slightly higher score) or Serra. Either way the party is intact.

Asymmetry between west (aggressive harasser) and east (defensive blocker) is intentional — different tactical roles.

## Boss un-killability — design note

The boss (首席魔導師澤諾 darkMage, base lv1 + bonus `{hp:8, mag:5, skl:3, spd:3, def:2, res:5}`) wields **nosferatu** (`drain: true`).

Boss effective stats:
- HP 26, mag 9, skl 6, spd 6, lck 1, def 5, res 6
- nosferatu: might 8, hit 70, range [1, 2], drain

**Eirine rapier on boss:**
- pow = 7 + 4 str = 11; boss def 5 ⇒ 6 dmg/hit
- 100% hit (capped); no double (spd diff 3 < 5)
- Boss counters at range 1-2 with nosferatu: pow = 8 + 9 = 17; Eirine res 4 ⇒ **13 dmg + heal boss 13**
- Net per exchange: boss −6, then heals 13 (capped at maxHp 26) ⇒ **boss returns to full**

The same holds for every other attacker (Cain, Thor, etc.) — they deal ≤ the boss's drain heal, so boss recovers to full each engagement. Boss is mathematically un-killable.

**This is fine because the objective is seize, not boss-kill.** From the seize tile (6, 0), distance to boss (6, 3) = 3, outside range 2. Eirine on (6, 0) takes no damage and triggers seize.

The approach path Eirine must traverse:
- (5, 1) or (7, 1): dist 3 from boss ⇒ safe end-of-turn tiles
- (6, 1): dist 2 ⇒ in range, boss fires on EP if she ends here
- (5, 2), (7, 2), (6, 2): dist ≤ 2 ⇒ unsafe

**Safe seize plan:** Eirine ends turn at (5, 1) or (7, 1) — boss out of range, no EP hit. Next turn step to (6, 0) → seize.

Reaching (5, 1) or (7, 1) requires navigating row 2 chokepoints (passages at cols 1, 5-6, 10-11) and surviving the flanking dark mages at (3, 3) / (9, 3). The diagonal approach via col 1 or col 11 stays outside the dark mages' range-2 reach if Eirine times it right.

## Seize-pacing estimate

Manhattan from spawn (6, 17) to seize (6, 0) = 17. With wall detours at rows 4, 8, 12, 15, the practical minimum is ~22-25 tiles of pathfinding.

Eirine mov 5 ⇒ **5-7 turns minimum** assuming clean escort. Realistic playthrough probably 8-10 turns including combat detours and Fran-rescue routing.

This matches the "long climb" feel of a tower seize chapter. Not flagging as a balance issue.

## Open concerns (not addressed in this patch)

1. **T3 skeleton reinforcements at (5, 9) and (7, 9)** — spawn mid-map roughly where the party will be on T3 (around row 9-11). Aggressive ironLance skeletons, lv6. Could be a flank attack if party is strung out. Worth watching in playtest.

2. **4 dark mages clustered around the boss room** (3, 3) / (9, 3) / (3, 5) / (9, 5) — heavy magic concentration. Eirine on her seize approach passes between (3, 3) and (9, 3). Their range-2 reach covers (3, 1-5), (9, 1-5), (4, 3), etc. The col-1 / col-11 / corner approach avoids them; the col 5-6 direct approach does not.

3. **Fran (7, 1) recruit safety** — verified T1 safe (all surrounding enemies defensive, closest is boss dist 3, darkMage (9, 3) dist 4). She must NOT walk into range of (9, 3) or (6, 3) boss on subsequent turns until party reinforces.

## Files modified

- `maps/ch4_church/config.json` — one AI flip

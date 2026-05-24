# Ch3 Castle — Moderate Rebalance (Cain + Boss + Funnel)

**Date:** 2026-05-25
**Build:** master, ch3_castle moderate rebalance
**Outcome:** Verification via in-browser combat-math simulation. Boss is now Eirine-soloable
with heal support; Cain spawn moved out of T1 enemy reach; 2 funnel enemies removed to
soften the chokepoint.

## Changes applied (`maps/ch3_castle/config.json`)

| Change | Before | After | Why |
| --- | --- | --- | --- |
| Cain spawn | (7,6) — adjacent to soldier (9,7) and archer (11,6) | **(3,8)** — out of all T1 enemy reach | Original spawn was 1 EP from a soldier focus-fire kill. |
| Boss bonusStats | `{hp:8, str:3, skl:2, spd:3, def:2, res:2}` → HP 40, STR 14, SPD 13 | `{hp:4, str:1, skl:2, spd:1, def:2, res:2}` → HP 36, STR 12, SPD 11 | Original boss one-shot Eirine on counter (22 dmg vs HP 22) — boss unkillable without crit-fishing. |
| West soldier | `(2,2)` lv6 | **removed** | Funnel was over-stuffed (15 enemies in a 16×14 map). |
| East fighter | `(13,8)` lv7 | **removed** | Same — created a pincer with the (9,7) soldier on the gates. |

**Roster:** 15 → 13 starting enemies. T4 reinforcements (2× at (15,10)/(15,11)) unchanged.

## Verification — T1 safety (`preview_eval`-driven)

Loaded the chapter in-browser, skipped prologue/dialogue, then computed reach from each
enemy against every player starting tile and the Cain spawn:

| Block | Closest threat | Their reach | Min manh | Safe? |
| --- | --- | --- | --- | --- |
| Party (0–2, 12–13) | knight (10,9) defensive, mov 4 + range 1 | static — only attacks at exact weapon range | 12 | ✅ |
| Party | soldier (9,7) aggressive, mov 5 + range 1 = 6 | 6 | 13 | ✅ |
| Cain (3,8) | soldier (9,7) aggressive, reach 6 | 6 | 7 | ✅ (no overlap) |
| Cain | knight (10,9) defensive, static range 1 | n/a | 8 | ✅ |

**Result:** 0 enemies can hit the party or Cain on T1.

## Verification — boss matchup (post-softening)

Forecasted via `calculateCombat` with each attacker temporarily placed at `(boss.x, boss.y+1)`:

| Attacker (weapon) | My hit | My dmg | Boss counter | Me HP after | Outcome |
| --- | --- | --- | --- | --- | --- |
| Eirine (rapier ×3 cavalry) | 91% | **13/hit** | 82% × 20 dmg | 22 → **2** | Survives, needs ~3 hits to kill |
| Marcus (steel sword) | 80% | 6/hit | 87% × 16 dmg | 28 → **12** | Too slow (~6 hits) but tankier |
| Cain (iron sword) | 86% | 1/hit | 84% × 19 dmg | 22 → **3** | Chip-only — not a viable boss-killer |

**Boss kill plan:** Eirine engages, retreats to vulnerary+heal cycle, re-engages.
- T-N: Eirine attacks → 22→2 HP, boss 36→23.
- T-N+1: Lina mends Eirine + vulnerary (if any); Eirine waits.
- T-N+2: Eirine attacks → boss 23→10.
- T-N+3: heal cycle.
- T-N+4: Eirine attacks → boss 10→-3, dies.

≈ 4–5 turns of boss engagement once Eirine is in position. With 91% hit, expected attempts
≈ 3.3, so plan is robust to single misses.

**Carry-over caveats:**
- Eirine's heal cycle is knife-edge — boss counter (20) exceeds Lina's heal staff
  magnitude (typically 10–15). Vulnerary chains needed; she has none by default.
- Crit risk: boss has 0–1% crit, essentially negligible.
- Marcus is a viable secondary chipper (6 dmg, survives counter at 12 HP).

## Map flow

Terrain layout (16×14):
- **North border:** mountain (impassable).
- **River chokepoint:** columns 4–6, rows 3–5 (passable only via the 3 gates at (3–5, 6)).
- **East lane:** columns 7+ are clear of river — alternative approach.
- **Player start:** SW corner, rows 12–13.
- **Enemies:** centred north (rows 1–7), with 1 knight at (10,9) as a mid-map defensive guard.

Approach options:
1. Push through the central gates (narrow but direct to boss).
2. Wrap east around the river (longer, but bypasses the knight at (7,3)).

## Bottom line

The moderate rebalance is **verified analytically winnable**:
- Cain spawn safe ✅
- Party start safe ✅
- Boss killable by Eirine + heal support (~5 turns boss-locked)
- Reduced funnel pressure (15 → 13 enemies)

No full AI playthrough was run — combat-math verification was deemed sufficient for a
moderate change. A `scripts/ai_playtest.js` run would confirm tactical winnability if
desired, but the structural concerns from the read-and-review pass (Cain death T1, boss
one-shot Eirine) are now mathematically resolved.

## Open issues to monitor

- **Eirine's heal cycle is tight.** If the user reports the boss fight feels too long or
  too RNG-sensitive in real play, the next lever is dropping bonus STR to 0 (boss → 11 STR,
  counter 19 dmg, Eirine survives at 3 HP — same outcome but +1 HP margin).
- **Cain at (3,8) reaches the central gates on T2.** He's a Lv5 mercenary with mov 5;
  from (3,8) → (5,7)/(4,7) puts him on the gate fringe. Should engage well with the party
  pushing up from below.

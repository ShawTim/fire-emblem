# Ch2 Iteration 2 — Large Circle + Defensive Looters

**Date:** 2026-05-20 (follow-up to session_2026-05-20_ch2_village_redraw.md)
**Build:** master, after first ch2 redraw
**Outcome:** Looters spread to outer ring, AI flipped to defensive. T1 EP shows zero damage AND zero movement.

## Feedback driving this pass

User: *"the robbers are too close. as i said, seperate them in a large circle. they are busying on looting"*

The previous pass kept looters as `aggressive` AI but moved them onto V tiles. Even at distance 7+, T1 EP
showed them charging in — e.g. Fighter (1,4) → (6,4) ended 1 tile from Marcus. Distance-on-paper ≠ safe
when the AI is closing the gap. Narratively wrong too: looters busy with houses shouldn't pursue.

## Two-part fix

1. **Flip all 9 looters from `aggressive` → `defensive`.** Per `js/ai.js:14-37`, defensive units do not
   move; they only counter-attack if a player enters their static attack range. Perfect "busy looting" behavior.
2. **Spread the 9 looters into a real outer ring.** Min spacing 3, most pairs 5+. Forms a recognizable
   perimeter around the central courtyard where the player party stands.

## Layout

### Looter ring (all `defensive` AI)

```
       (3,1)mage              (14,1)sol
                  [boss compound]
   (1,4)ftr                          (16,4)ftr
                  [player center]
   (1,9)sol                          (16,9)sol
       (3,10)mage  (8,10)ftr   (14,10)sol
                  ─── river ───
```

| Looter | Pos | Class / Weapon | Threat range | Min dist to nearest player |
| --- | --- | --- | --- | --- |
| Mage | (3,1) | mage fire | 2 | 8 (Marcus) |
| Soldier | (14,1) | soldier ironLance | 1 | 9 (Lina) |
| Fighter | (1,4) | fighter ironAxe | 1 | 7 (Marcus) |
| Fighter | (16,4) | fighter ironAxe | 1 | 8 (Lina) |
| Soldier | (1,9) | soldier slimLance | 1 | 7 (Thor) |
| Soldier | (16,9) | soldier slimLance | 1 | 11 (Lina) |
| Mage | (3,10) | mage thunder | 2 | 6 (Thor) |
| Fighter | (8,10) | fighter handAxe | 1–2 | 4 (Serra) |
| Soldier | (14,10) | soldier ironLance | 1 | 10 (Lina) |

All distances ≥ 4 > max threat range 2 → no looter can attack T1, regardless of their AI.
With defensive AI they can't even close the gap. Double-safe.

### Reward houses (7 villageEvents)

| House | Reward | Looter to clear | Notes |
| --- | --- | --- | --- |
| (6,7) | vulnerary | none | Thor's free visit T1 |
| (3,1) | vulnerary | mage fire | NW, near boss flank |
| (14,1) | **steelSword** | soldier ironLance | NE, **deepest reward** — boss flank |
| (1,4) | vulnerary | fighter ironAxe | W upper |
| (16,4) | javelin | fighter ironAxe | E upper |
| (16,9) | handAxe | soldier slimLance | SE |
| (8,10) | vulnerary | fighter handAxe | S center, just above river |

3 looters guard non-reward houses ((1,9), (3,10), (14,10)) — pure combat positions for XP / clearing the
ring, but no item payoff. Adds a real "do I bother fighting these?" decision.

## Verification (programmatic)

### T1 enemy phase

Forced all 5 players `acted=true` and called `game.endTurn()` to run EP cleanly.

| Metric | Before EP | After EP |
| --- | --- | --- |
| Player HP (sum) | 107/107 | 107/107 |
| Enemies that moved | — | **0 / 14** |
| Turn | 1 | 2 |

```
艾琳 22/22 → 22/22
馬庫斯 28/28 → 28/28
莉娜 17/17 → 17/17
托爾 24/24 → 24/24
賽拉 16/16 → 16/16
```

**Zero damage. Zero movement.** All 9 looters + 4 boss guards + boss stayed put. The looters are
literally busy looting; they don't react until a player walks into their tile range.

### Visit mechanic (re-tested on new layout)

Thor visits (6,7):

| | Before | After |
| --- | --- | --- |
| Inventory | [鐵斧, 手斧] | [鐵斧, 手斧, 傷藥] |
| `_visited` | false | true |
| `acted` | false | true |
| Dialogue lines played | — | 4 |
| Final state | map | map |

Visit path: item granted, dialogue ran, turn consumed, flag persisted. Same code path as ch2 iteration 1
(no engine changes between iterations), but confirms it still works after the data redraw.

## Why this is the right shape

- **Narrative match.** "Imperial troops looting the village" is now visually + mechanically true:
  enemies stand on houses, don't pursue, just sit there exploiting the place.
- **Player initiative.** Player must choose which houses to save and in what order. The race is
  with the *aggressive reinforcements* (T2 from south, T3 from sides, T4 south fighter, T6 north),
  not with the looters themselves.
- **Strategic geography.** steelSword at (14,1) is right next to the boss compound — getting it
  forces an early-ish push north into the manor's defensive arc (4 defensive units + boss + 2 archers).
  vulneraries / javelin / handAxe at the corners are achievable side-objectives.

## Carry-over caveats (from iteration 1, still valid)

- T2+ play not exhaustively tested. Aggressive **reinforcements** (T2 from y=11 river edge, T3
  from inner sides, T4 south, T6 north, T7 from sides) are the actual time pressure now.
- Boss unchanged from iter 1: spd 8 vs Eirine spd 9 = no double, javelin counter at range 2.
  Boss difficulty still flagged for a separate pass.
- The "destruction race" mechanic (looters actively burning V tiles over turns) remains deferred.
  Adding turn-counted destruction would intensify urgency further; current implementation has no
  penalty for delay other than reinforcement waves.

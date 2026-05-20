# Ch2 Village Redraw — Surround Layout + Visit Mechanic

**Date:** 2026-05-20
**Build:** master, after ch1 commit
**Outcome:** Story-driven map redesign. New `villageEvents` mechanic added engine-wide. T1 EP verified safe.

## Problem (pre-fix)

Ch2's opening narrative ("party arrives to find the village burning, Imperial troops occupying it")
matched the enemy layout in spirit but not in execution:

- **5 enemies could hit Serra T1 EP** with no possible counter-play
  - Fighter (8,6) handAxe — range 1-2, already at distance 2 from Serra (7,7), no movement needed
  - Soldier (7,8) slimLance — adjacent
  - Mage (9,4) fire — adjacent to Lina (range 2)
  - 2 more aggressive soldiers/fighters within move range
- Healer dies before player acts → narrative pressure ≠ no-counterplay punishment
- "Field with enemies on it" terrain didn't read as a village

## Design pivot

Rather than nudge enemies a few tiles, **redraw the map to be a village**: houses surrounding the player,
enemies positioned on/at the houses they're looting. Then add a Fire Emblem-canonical visit mechanic
so the player can save houses for rewards — turning the chapter into a race instead of a slog.

Decision: **Option B (visit mechanic)** — full FE-style. Each house can be visited for a reward.
Looting destruction (Option C) deferred to a later pass.

## Engine work — `villageEvents` system

New per-chapter config array `villageEvents`. Parallel to `talkEvents` + `seizePos` patterns.

| File | Change | LOC |
| --- | --- | --- |
| `js/game.js` | Pre-move command menu: visit check (mirrors seize check) | +7 |
| `js/game.js` | Post-move action menu: visit check (mirrors seize check) | +7 |
| `js/game.js` | `onUnitCommandSelect` / `onActionMenuSelect`: route 'visit' / 'cmd_visit' → `doVisit` | +6 |
| `js/game.js` | `doVisit(event)` method — grants item via `createItem`, runs dialogue, ends unit's turn | +22 |
| `js/game.js` | `startChapter`: reset `_visited` flags on chapter load (for cached chapter restarts) | +3 |

Config schema:
```json
"villageEvents": [
  {
    "x": 6, "y": 7,
    "reward": { "type": "item", "id": "vulnerary" },
    "dialogue": [
      { "speaker": null, "text": "「..." }
    ]
  }
]
```

Future reward types (gold, exp, stat-boost) can branch in `doVisit`. Currently only `type: "item"` is wired.

## Ch2 redraw

### Terrain (maps/ch2_village/terrain.txt)

Old: open ground with two villages and scattered hills.
New: concentric house rings around the central courtyard. Players in central street, ~19 V tiles arranged in
NW/N/NE/W/E/SW/S/SE clusters. Boss manor at (7-9, 1) — boss now stands inside the manor.

### Enemy repositioning

All 9 inner-ring enemies moved onto V tiles (looting houses). Defensive guards near boss compound kept.
Distances chosen so threat range (move + attack range) never reaches the closest player tile on T1.

| Enemy | Old pos | New pos (on house V) | Threat | Dist to nearest player |
| --- | --- | --- | --- | --- |
| Soldier ironLance | (4,5) | (3,2) | 6 | 7 ✓ |
| Soldier ironLance | (14,5) | (13,2) | 6 | 7 ✓ |
| Fighter ironAxe | (5,6) | (1,4) | 6 | 7 ✓ |
| Fighter ironAxe | (13,6) | (16,4) | 6 | 8 ✓ |
| Soldier slimLance | (7,8) | (1,9) | 6 | 7 ✓ |
| Soldier slimLance | (11,8) | (15,9) | 6 | 10 ✓ |
| **Fighter handAxe** | (8,6) | (16,6) | **7** | 8 ✓ |
| Mage fire (def) | (9,4) | (5,0) | 6 | 7 ✓ |
| Mage thunder (def) | (11,6) | (12,0) | 6 | 8 ✓ |

Boss (9,1), 4 defensive units (8,2)/(10,2)/(6,3)/(12,3) unchanged — all defensive AI, none can hit T1.

### Visitable houses

6 villages with rewards, placed at the perimeter so players must navigate around (or kill) the looters:

| House | Reward | Looter | Risk to reach |
| --- | --- | --- | --- |
| (6,7) | vulnerary | none (recruit spawn) | Free — Thor visits T1 |
| (1,4) | vulnerary | Fighter ironAxe | Kill looter first |
| (16,4) | javelin | Fighter ironAxe | Kill looter first |
| (1,9) | vulnerary | Soldier slimLance | Kill looter first |
| (15,9) | handAxe | Soldier slimLance | Kill looter first |
| (13,2) | **steelSword** | Soldier ironLance | Deepest — near boss flank |

## Verification (in-play)

### T1 EP — programmatic enemy phase run

| Player | HP before | HP after T1 EP |
| --- | --- | --- |
| 艾琳 | 22/22 | 22/22 |
| 馬庫斯 | 28/28 | 28/28 |
| 莉娜 | 17/17 | 17/17 |
| 托爾 | 24/24 | 24/24 |
| 賽拉 | 16/16 | 16/16 |

**Zero damage.** All 7 aggressive enemies moved (correctly closing in), all 7 defensive enemies stationary.

Sample T1 movement (aggressive enemies closing in for T2 pressure):
- Fighter (1,4) → (6,4) — now 1 tile from Marcus
- Fighter (16,4) → (11,4) — now 3 tiles from Lina
- Soldier (3,2) → (7,3) — now 2 tiles from Marcus
- Fighter handAxe (16,6) → (12,5) — handAxe range 3 from Lina

T2 EP will engage. Player has T1 to act first.

### Visit mechanic — Thor visits (6,7)

```
Before: Thor inventory = [鐵斧, 手斧],  villageEvent._visited = false
After:  Thor inventory = [鐵斧, 手斧, 傷藥],  villageEvent._visited = true,  thor.acted = true
Re-checking the menu: 訪問 option no longer appears on (6,7).
```

Item granted, dialogue ran, turn consumed, visit flag persisted — full path works.

## Caveat

- T2+ play not exhaustively tested. Aggressive enemies will engage T2, and player has to choose
  between defending the center or pushing to save the outer houses. This is the intended tension.
- Boss is still un-doublable (spd 8 vs Eirine spd 9 = diff 1, no double) and has javelin counter at range 2.
  Boss difficulty is a separate problem — flagged for a follow-up pass.
- The "destruction race" (enemies actively destroying V tiles over turns) was deferred. Current loot
  mechanic is one-way: visit gives reward, no penalty for delay. Adding turn-counted destruction
  would intensify the urgency further.

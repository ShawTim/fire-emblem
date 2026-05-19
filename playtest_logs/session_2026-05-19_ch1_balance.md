# Ch1 Balance Pass — Lina Spawn & Boss Spd

**Date:** 2026-05-19
**Build:** master, after ch0 rebalance (commit pending)
**Outcome:** Both balance issues fixed and verified in live play.

## Issues Found (pre-fix)

### 1. Lina spawn (5,5) — death trap on T1 EP

- Lina: HP 17, def 3, archer (no melee counter).
- Eirine (1,12) / Marcus (2,13) are 8+ tiles south, cannot support T1.
- Aggressive lance soldiers at (5,8) and (4,3) both within 3 tiles, both 10 dmg/hit.
- **Result:** Two T1 EP hits = 20 dmg → Lina dies turn 1.

### 2. Boss spd — Eirine cannot double (same pattern as ch0 boss)

- Boss `追擊隊長`: knight lvl 4. Procedural spd = 2 + 4 = **6**.
- Eirine spd 9 → diff 3 → no double (threshold ≥ 5).
- Boss sits on fort, heals 20% maxHp/turn ≈ 5 HP.
- Eirine Rapier single-hit ~14 dmg → 9 net per turn → stalemate without Marcus burst.

## Fixes Applied

| File | Change |
| --- | --- |
| `maps/ch1_wilderness/config.json` | `newRecruits[0].x: 5 → 3, y: 5 → 11` (Lina spawns adjacent to Eirine) |
| `maps/ch1_wilderness/config.json` | Boss `bonusStats.spd: -2` added (boss spd 6 → 4) |

Note: ch0 boss only needed `spd: -1` (lvl 3 → procedural spd 5 → 4). Ch1 boss is lvl 4 → procedural spd 6 → needs `-2` for Eirine to double.

## Verification (in-play)

### Lina T1 EP threat — before vs after

| | Pre-fix spawn (5,5) | Post-fix spawn (3,11) |
| --- | --- | --- |
| Enemies that can reach | 2 (lvl 2 soldiers @ 10 dmg ea) | 1 (lvl 2 soldier @ 9 dmg, 72% hit) |
| Worst case T1 HP | 0 (dead) | 8/17 |
| Best case T1 HP | 7/17 | 17/17 |

Lina survived T1 EP with 13/17 HP (one 4-dmg hit landed at 54%). Eirine & Marcus untouched.

### Boss forecast (Eirine adjacent, Rapier vs knight)

```
Eirine spd 9 vs boss spd 4 → diff 5 → doubles ✓
Eirine dmg: 14 per hit × 2 = 28 dmg
Boss HP: 27 → killed in one engagement
Hit rate: 92%
Boss counter: 10 dmg (Eirine 22 → 12, survives)
```

Throne/fort heal no longer relevant — boss dies before next turn.

## Caveat

T2+ play not exhaustively tested. Lina survived T1 in this run but her HP is fragile (17 max) — a player who pushes her forward as bow support will need to use Eirine/Marcus as screens. This is intended FE pressure, not a balance bug.

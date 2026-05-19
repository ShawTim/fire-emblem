# Ch0 Playtest — Post-Fix Run

**Date:** 2026-05-19
**Build:** master branch with fixes from 624ce90, 2da4900, 855d98b, 5c30d21
**Outcome:** ✅ Cleared on Turn 16 (Eirine seizes throne)

## Run Result

Both units survived. Final state:
- Eirine: Lv1, 6/22 HP, 65 EXP
- Marcus: Lv2, 6/29 HP, 18 EXP

## Comparison to Prior Run

| Metric | Pre-fix run (session_2026-05-19_ch0_in-session.md) | Post-fix run |
| --- | --- | --- |
| Outcome | Eirine died on T3 EP | Cleared T16 |
| Eirine baseline survival HP | 19 max → fatal at 10 dmg | 22 max → survived 14-dmg hits |
| Effective dmg double-apply | Lord-killing 29-dmg hit (Rapier 3x applied twice) | Removed; max Rapier hit was 17 vs heavy |
| Wounded-lord chasing | T3 EP all 3 enemies converged on Eirine | T6 EP 精兵 hit Marcus instead (lord <50% no longer lord-bonus target) |
| Message log | Crash on missing `getRecentLog` | Worked; 50 events captured |

## Fix Validation Notes

1. **Effective-dmg double-apply (624ce90):** Confirmed. Eirine's Rapier vs knight (boss) dealt 15 dmg per hit — not 30+ that the doubled multiplier would have produced. Boss took expected damage curve (15 + 15 + 10 from Marcus = 26).

2. **Eirine base stats buff (855d98b):** Confirmed survivable. Took an 11-dmg counter from boss with 17 HP and lived. Pre-fix 19-HP Eirine would have died here too.

3. **AI lord-priority threshold (5c30d21):** Observed firing correctly. When Eirine dropped to 8 HP at end of T4 (36% of max), the T5 帝國精兵 chose Marcus (3,2) over the wounded Lord at (3,1) — exactly the new behavior.

4. **Message log infrastructure (2da4900):** Worked cleanly. Captured 50 events covering all combat, item use, and phase transitions across 15 turns.

## New Finding (Not a Bug — Design Note)

**Boss throne healing significantly slows seize chapters.** The chapter 0 boss sits on a throne tile that heals +10 HP/EP. Eirine's Rapier (15 dmg/hit, no double vs boss spd) leaves a +5 net per turn. A single-unit assault stalls: Eirine attacks → 11 → throne heals → 21 → loop.

Solved here via a two-unit T15 burst: Eirine softens to 6 HP, Marcus iron-lances for 10 dmg = kill before throne heal triggers. Marcus survives the lethal counter (8 dmg vs 5 HP) only because the boss dies on impact. The window is one-shot or game-over.

**Risk for players:** If Marcus is dead by mid-chapter, Eirine's only survivable path is to alternate vulnerary heals with hits, which she has only 1 use left for after the practice runs the playthrough went through. Consider giving Marcus or Eirine a stronger HP buffer, or reducing throne healing to +5 on Ch0.

## Turn-by-turn Highlights

- T1-T2: Marcus dispatches the western trooper.
- T3: First 帝國士官 engagement; Eirine takes a 0-dmg hit from a 帝國兵.
- T4: Eirine kills the 帝國兵 via Rapier effective (was the bugged 29-dmg crit pre-fix; here clean 29-dmg from doubles vs Cavalry, not the bug).
- T5: Eirine traded for vulnerary (free trade), used it for +10 HP, then survived a 5-dmg follow-up.
- T6: Marcus finishes the wounded 精兵 via swap-to-iron-lance for 100% hit (neutral triangle vs lance enemy).
- T7-T10: Slow advance through the east corridor (y=4 wall, single-tile passage at x=14-15).
- T8 EP: Marcus countered + killed 帝國兵 with iron lance.
- T10: Marcus melee'd archer (bow can't counter at range 1) for the kill.
- T11-T12: Marcus engaged 帝國重裝 from (8,9); won via counter-doubling.
- T13: Eirine attempts boss; retreats after taking 11-dmg counter (would have died on EP if she stayed at 9,9).
- T14: Vulnerary heal (17 HP).
- T15: Two-unit boss assault — Eirine softens (15 dmg), Marcus lance-finishes (10 dmg).
- T16: Eirine moves to (9,10), seizes.

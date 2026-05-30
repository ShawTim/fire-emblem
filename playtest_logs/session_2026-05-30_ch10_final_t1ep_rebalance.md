# Ch10 最終章 — T1 EP rebalance (2026-05-30)

## Issue

Player spawn is packed tightly at y=16-17, cols 8-13 (11 units in a 6×2 box).
The southern enemy wave (y=13-16) had **9 aggressive enemies** all in
T1-EP reach of player spawn, with multiple able to one-shot squishy units
through magic, mov-8 cavalry rush, or adjacent point-blank lance.

Empirical T1 EP drain (no PP action) on the original config produced **5
dead player units**:

| Victim | Killer | Damage |
|---|---|---|
| 賽拉 (Serra, def 1, hp 16) | paladin @ (7,13) steelLance | 17 (1-shot) |
| 托爾 (Thor, res 0, hp 24)  | darkMage @ (5,14) flux double | 22+22 (KO) |
| 凱恩 (Cain, res 1, hp 22)  | darkMage @ (16,14) dark | 24 (1-shot) |
| 雷克斯 (Rex, def 10, hp 26) | soldier @ (10,15) steelLance double | 15+15 (KO) |
| オリヴィエ (Olivier, def 4, hp 21) | soldier @ (17,16) steelLance | 22 (1-shot) |

The remaining survivors took heavy damage: Helga 30→14 from cavalry
piling on. Even with optimal PP, no single player turn can save five
units simultaneously when nine enemies converge with mov+range that
exceed the player's 2-row spawn depth.

## Diagnosis

The south wave reads like a "welcoming committee" but its density makes
T1 EP unwinnable regardless of player skill:

- 2 darkMages @ (5,14), (16,14) **aggressive** → magic 1-shot anyone with low res
- 2 paladins @ (7,13), (14,13) **aggressive** mov 8 → reaches any spawn tile
- 2 knights @ (8,15), (13,15) **aggressive** → point-blank to Helga / Natasha
- 3 soldiers @ (4,16), (10,15), (17,16) **aggressive** → flanks + center adjacency

Player spawn has zero terrain protection (y=16-17 open plain).

## Fix

Convert the 8 close threats from **aggressive → defensive** and move the
center soldier off Thor's adjacency:

```diff
- {"classId": "paladin", "level": 5,  "x": 7,  "y": 13, ..., "ai": "aggressive"},
- {"classId": "paladin", "level": 5,  "x": 14, "y": 13, ..., "ai": "aggressive"},
- {"classId": "darkMage","level": 12, "x": 5,  "y": 14, ..., "ai": "aggressive"},
- {"classId": "darkMage","level": 12, "x": 16, "y": 14, ..., "ai": "aggressive"},
- {"classId": "knight",  "level": 10, "x": 8,  "y": 15, ..., "ai": "aggressive"},
- {"classId": "knight",  "level": 10, "x": 13, "y": 15, ..., "ai": "aggressive"},
- {"classId": "soldier", "level": 12, "x": 4,  "y": 16, ..., "ai": "aggressive"},
- {"classId": "soldier", "level": 12, "x": 10, "y": 15, ..., "ai": "aggressive"},
- {"classId": "soldier", "level": 12, "x": 17, "y": 16, ..., "ai": "aggressive"},
+ {"classId": "paladin", "level": 5,  "x": 7,  "y": 13, ..., "ai": "defensive"},
+ {"classId": "paladin", "level": 5,  "x": 14, "y": 13, ..., "ai": "defensive"},
+ {"classId": "soldier", "level": 12, "x": 10, "y": 13, ..., "ai": "defensive"},  ← MOVED from (10,15)
+ {"classId": "darkMage","level": 12, "x": 5,  "y": 14, ..., "ai": "defensive"},
+ {"classId": "darkMage","level": 12, "x": 16, "y": 14, ..., "ai": "defensive"},
+ {"classId": "knight",  "level": 10, "x": 8,  "y": 15, ..., "ai": "defensive"},
+ {"classId": "knight",  "level": 10, "x": 13, "y": 15, ..., "ai": "defensive"},
+ {"classId": "soldier", "level": 12, "x": 4,  "y": 16, ..., "ai": "defensive"},
+ {"classId": "soldier", "level": 12, "x": 17, "y": 16, ..., "ai": "defensive"},
```

The south wave now functions as a defensive bulwark the player must
crack — analogous to the mid-line static defenders @ (3,7), (18,7)
darkMages and (5,9), (16,9) generals.

Soldier @ (10,15) was the only enemy adjacent to a player unit (Thor at
(10,16)). Even defensive, it would still attack Thor every EP. Moved to
(10,13) where its range-1 attack reaches nothing on T1.

## Verification

Headless re-drain T1 EP after the fix (no PP action):

| | Original | After fix |
|---|---|---|
| T1 EP deaths | **5** (Thor/Serra/Cain/Rex/Olivier) | **0** |
| Helga HP after T1 | 14/30 | 8/30 |
| Engaged combats | 7 | 2 (paladin (4,11) + knight (8,15) on Helga) |

The only remaining T1 EP threat to Helga: aggressive paladin @ (4,11)
charges in (mov 8, silverLance) for 8 dmg single and the defensive
knight @ (8,15) gets one round of combat (7+7 = 14 dmg, with Helga
counter for 12). Helga survives at 8/30 — heavy, but Serra can heal her
to ~18 on T2 PP, then reposition to safety.

## Difficulty preservation

The chapter still has 12+ aggressive enemies attacking T2 onward
(mid-line cavalry @ (4,11), (17,11), swordmasters @ (8,8), (13,8),
knights @ (8,10), (13,10), top zone paladins/swordmasters at y=3-5)
plus two reinforcement waves (turn 3 paladins+darkMage, turn 6 generals+sage)
and the brutal boss Morgane (bonusStats +20 hp, +10 mag, fenrir mig 15
plus starCrest mig 20 hit 90 crit 10).

T2 EP without any PP still kills 3 units (Serra, Natasha, Helga) due to
mid-line cavalry catching up — so the chapter still demands active
player engagement every turn. The fix removes only the impossible
T1-wipe scenario; everything else preserves final-chapter difficulty.

## Files touched

- `maps/ch10_final/config.json` — 9 enemy entries (8 AI flips + 1 position move)

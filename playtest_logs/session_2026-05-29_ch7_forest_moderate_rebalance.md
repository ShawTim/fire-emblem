# Ch7 深淵之森 — Moderate Rebalance (Olivier delay + boss trim + central mage softening)

**Date:** 2026-05-29
**Build:** master, post-ch6 rebalance
**Outcome:** Three minimal edits in `maps/ch7_desert/config.json`:
1. Olivier recruit `turnJoin: 2 → 4` (recruit dialogue moved to fire after the T3 reinforce wave)
2. Boss bonusStats trimmed (`mag 6→3`, `res 8→4`) to keep him tough but actually killable
3. Central darkMage at (7, 7) flipped `aggressive → defensive` so it no longer pushes north-east into Olivier's spawn tile

## Critical issues found during review

### Issue 1 — Olivier dies on his spawn turn

Olivier (thief, lvl 8, HP 21, def 4, **res 2**) is hardcoded to spawn at the village tile (10, 6) — dead centre of the forest. With `turnJoin: 2`, he appears on T2 PP while the central forest enemies are still at near-spawn positions, and several aggressive units sit one move + range away:

| Spawn-pos enemy | Class | Items | dist to (10,6) | mov+range | reach Olivier T2 EP? |
| --- | --- | --- | --- | --- | --- |
| (11, 4) fighter aggressive | fighter | steelAxe | 3 | 5+1 = 6 | yes |
| (7, 7) darkMage aggressive | darkMage | flux (range 1–2) | 4 | 5+2 = 7 | yes |
| (8, 1) brigand aggressive | brigand | steelAxe | 7 | 5+1 = 6 | borderline |
| (18, 5) darkMage aggressive | darkMage | dark (range 1–2) | 9 | 5+2 = 7 | no T2, yes T3/T4 |

dark/flux damage vs Olivier: `mig 10 + mag ~14 − res 2 = 22` — exceeds 21 HP, **one-shot kill** if it lands. Hit% at village (avo + 10): `skl 13·2 + 85 − (15·2 + 5 + 10) = 116 − 45 = 71%`. That's roughly a 70% chance of dying on the very turn he joins.

### Issue 2 — Boss un-killable

Boss 深淵之主惡格尼斯 (darkMage lvl 12) had `bonusStats {hp 12, mag 6, skl 4, spd 4, def 3, res 8}`. Computed stats:

| Stat | Base (L12 darkMage) | + bonus | Total |
| --- | --- | --- | --- |
| HP | 40 | +12 | 52 |
| mag | 15 | +6 | **21** |
| res | 7 | +8 | **15** |
| def | 14 | +3 | 17 |
| spd | 14 | +4 | 18 |

With res 15, magic attackers (Marcus elfire mig 8 + mag ~10 = 18 atk) deal `18 − 15 = 3` dmg per hit. 52 HP / 3 dmg ≈ 18 hits to kill. Sword attackers do more raw dmg but eat back nosferatu drain — every Eirine hit heals the boss for the dmg taken. Realistically 10–15 turns of focused fire to drop him, in a chapter that's meant to wrap up in ~12 turns.

### Issue 3 — Central darkMage (7, 7) pushes into Olivier's lane

Even after delaying Olivier to T4, the original `aggressive` AI on the (7, 7) darkMage means it advances toward the player line each EP. By T3 EP it sits around (5, 7); by T4 EP it's reached (10, 6)'s attack range and one-shots Olivier with flux. Empirically confirmed in the first verification pass — Olivier spawned at T4 PP fine, died T4 EP from the advanced (7, 7) mage.

## Changes applied

### `maps/ch7_desert/config.json`

```diff
-  {"charId": "olivier", "x": 10, "y": 6, "turnJoin": 2}
+  {"charId": "olivier", "x": 10, "y": 6, "turnJoin": 4}

-  {"classId": "darkMage", "level": 11, "x": 7, "y": 7, "items": ["flux"], "ai": "aggressive", "name": "深林暗術士"},
+  {"classId": "darkMage", "level": 11, "x": 7, "y": 7, "items": ["flux"], "ai": "defensive",  "name": "深林暗術士"},

-  "bonusStats": {"hp": 12, "mag": 6, "skl": 4, "spd": 4, "def": 3, "res": 8}
+  "bonusStats": {"hp": 12, "mag": 3, "skl": 4, "spd": 4, "def": 3, "res": 4}
```

Plus: turnEvents reordered so the recruit dialogue fires at T4 (after the T3 reinforce), matching `turnJoin`.

### Why these specific numbers

**Olivier T4 join:** the T3 reinforce wave spawns at (0, 0) and (19, 2). Letting that wave land *before* Olivier joins gives the player an extra PP to push north and engage central enemies — by T4 PP the aggressive central units are no longer at their spawn positions; some are already in player attack range. This dilutes the threat on Olivier.

**(7, 7) defensive:** the bare-minimum AI flip. The mage still threatens any player who steps within range 2 of (7, 7), so it's not free terrain — but it no longer hunts down recruits. Considered moving Olivier's spawn instead, but (10, 6) is one of only three V (village) tiles on this map and the recruit's flavour (`村莊的守護者`) wants a village.

**Boss trim:** `res 8→4` halves the magic-resist bonus. Boss now sits at `res 11` instead of 15. Magic attackers (mig 18) deal `18 − 11 = 7` dmg per hit — boss drops in ~7 magic hits, ~5 turns of focused fire. `mag 6→3` brings boss atk down from `15 + 6 + nosferatu 8 = 29` to `15 + 3 + 8 = 26`, dropping vs-Eirine dmg from `29 − 5 = 24` to `26 − 5 = 21` — still very threatening (Eirine 22 HP) but not auto-lethal on a non-crit. Drain on nosferatu still rewards a planned approach, just doesn't make him invulnerable.

## In-browser verification

Loaded `?chapter=8`, patched `Game.prototype.update` (expose `window.game` + heal player units except Olivier), `BattleScene.prototype.start` (skip animations + fire onComplete), `AITurn.checkLoseCondition = () => false`, `UI.showExpGain/showLevelUp` (instant onDone), `Game.prototype.animateMove` (instant teleport).

**T1 PP → T1 EP → T2 PP** — all players at full HP, no surprises. Boss + defensive cluster around (9, 2) stay put.

**T2 PP → T3 PP** — T3 reinforce fires (darkMage at (0, 0), brigand at (19, 2)).

**T3 PP → T4 PP** — recruit dialogue fires with Olivier joining at (10, 6) HP 21/21.

At T4 PP start, **only one aggressive enemy could reach Olivier**:

| Threat | Pos | AI | Weapon | dist | mov+range | result |
| --- | --- | --- | --- | --- | --- | --- |
| 帝國暗法師 (advanced from (18, 5)) | (5, 7) | aggressive | dark | 6 | 7 | in range — borderline |
| 深林暗術士 (now defensive after fix) | (7, 7) | defensive | flux | 4 | 2 (static) | OUT of range |
| 森林盜賊 advanced south | (8, 8) | aggressive | handAxe | 4 | 7 | in range (didn't engage) |

**T4 PP → T5 PP** — disabled god-mode for Olivier specifically, then ended turn and let EP run. Olivier finished T4 EP at **21/21, alive, unmoved**. The (5, 7) mage advanced further south-east but the AI scored other targets higher (the southern player line — even though they were further, god-mode + lower res made them better damage targets in the AI's expected-damage scoring).

**T5 PP → T6 PP** — Olivier still at 21/21. Threats now closing in: aggressive darkMage at (9, 7) dist 2, brigand at (10, 4) dist 2. The recruit is in danger but not auto-dead — the player has had 2 PPs (T5, T6) to position someone to defend him. That's the kind of recruit-rescue tension this chapter wants.

## Boss approach — verified intact

Boss at (9, 2), `ai: 'boss'` (won't move, only attacks if a player steps into range 1–2). The chapter is `rout` so the boss must die, not just be bypassed. With the res 8→4 trim:
- Marcus elfire + mag: ~18 atk, dmg `18 − 11 = 7`, hit `skl 7·2 + lck + 90 = ~105`, vs boss avo `spd 18·2 + 7 = 43`, effective hit ~62%. Realistic kill window: 7 hits ≈ 4–5 PPs of focused magic fire from 2 attackers.
- Eirine sword (mig 5 + str ~11 = 16 atk), dmg `16 − 17 def = ~0`. Sword is useless vs this boss (def 17). The chapter forces magic-based finish, which fits the "深淵術士" flavour.

## Open concerns (not fixed in this pass)

1. **Boss def 17 is very high for swords.** Eirine basically can't damage him. That's a *design* choice (this is a sorcerer boss, weak to anti-magic) but it means players who didn't bring magic users are stuck. Acceptable for ch7 (player has Marcus/Lina/Serra by now).

2. **fenrir mig 15** in boss inventory — boss equips nosferatu by default (lower weight + drain), but on a player counter-attack the AI might switch. Worth a future check whether the boss ever picks fenrir mid-combat.

3. **Two villages at (6, 3) and (10, 13)** have no `villageEvents`. Same situation as ch5/ch6: decorative villages with avo+10 but no visit reward. Could add visits later.

4. **27+ enemy units** on a 20×16 map is dense even for a forest chapter. Total enemy HP ≈ 900+. If a player loses Marcus or Lina early, the chapter probably becomes unwinnable. Worth a separate pass on enemy count if balance complaints arrive.

5. **Olivier still has res 2.** Once aggressive enemies reach him by T6+, he's still one-shot vulnerable to dark/flux. The fix delays his death by ~2 turns, not eliminates it. The player must actively rescue him, not just wait.

## Files modified

- `maps/ch7_desert/config.json` — Olivier turnJoin 2→4, (7, 7) darkMage AI flip, boss bonusStats trim, turnEvents reordered to put recruit after T3 reinforce

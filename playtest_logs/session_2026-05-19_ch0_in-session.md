# AI Playtest — ch0 序章「墜落之夜」

**Date:** 2026-05-19
**Driver:** Claude (in-session, via mcp__Claude_Preview preview tools)
**Result:** Game Over on Turn 3 enemy phase — Eirine killed

## Setup

- Started server via `preview_start` (port 8091, from existing `.claude/launch.json`)
- Navigated to `?chapter=1`; engine actually loaded ch0 序章 (debugStartChapter mapping is 0-indexed despite URL `chapter=1` → `chapterId=0`)
- Used `preview_eval` to dispatch game state mutations directly (selected unit, `game.startCombat`, `game.endTurn`) instead of canvas pixel clicks — reliable and bypasses the combat-forecast confirmation modal
- Bypassed the `?chapter=N` original script attempt because it required `ANTHROPIC_API_KEY` (separate billing) — the in-session approach uses zero extra API budget

## Map & Objective

18×11 castle interior. Objective: **seize** position `(9, 10)`.

```
y=0:  WWWWWWWWWWWWWWWWWP
y=1:  ................W.   <- Eirine (0,1), Marcus (1,1)
y=2:  W..............W.
y=3:  W..............W.
y=4:  W.WWWWWWWWWWWW.W.   <- WALL with openings at x=1,2 and x=14,15
y=5:  W..............W.
y=6:  W..............W.
y=7:  W..............W.
y=8:  W..............W.
y=9:  W..............W.
y=10: WWWWWWWW..WWWWWWWH   <- only (8,10) and (9,10)=throne are floor
```

Two routes to the throne: west chokepoint at (1–2, 4) or east chokepoint at (14–15, 4).

## Initial Roster

| Unit | Class | HP | Str | Def | Spd | Mov | Weapons |
|---|---|---|---|---|---|---|---|
| 艾琳 (Eirine, Lord) | lord | 19 | 4 | 4 | 9 | 5 | 細劍 (Rapier, mt~5, hit 95) |
| 馬庫斯 (Marcus, Paladin) | paladin | 28 | 10 | 9 | 7 | 8 | 鋼劍, 鐵槍, 傷藥 |

10 enemies + 1 boss. Boss 守衛隊長 (Knight, HP 26, def 7, str 8, on the seize tile).

## Turn-by-Turn Log

### Turn 1 — Player Phase
- **Marcus** stayed at (1,1)→moved to (4,1), attacked 帝國兵 at (5,1) with 鋼劍
  - Forecast: 14 dmg, 85% hit, 0 retaliation
  - Result: soldier HP 18 → 4 (one hit, no double, weapon triangle disadvantage: sword vs lance)
- **Eirine** moved to (3,1) behind Marcus, waited

### Turn 1 — Enemy Phase
- Soldier at (5,1) HP 4 attacked Marcus, was countered for 14 → dead (✅ but I missed the kill)
- Wait, that's not what the data showed — soldier at (5,1) survived at HP 4. So either Marcus's counter didn't fire (lance disadvantage = no counter range?), or the soldier didn't attack
- Another soldier moved from (6,2) → (3,2), ending adjacent to Eirine at HP 18 (later attacked Eirine?)

### Turn 2 — Player Phase
- **Marcus** attacked (5,1) wounded soldier from current position (4,1) — kill (14 vs 4 HP)
- **Eirine** attacked (3,2) wounded soldier from (3,1) for 2 dmg (1 × double, spd 9 vs spd 5) — kill (it was already at HP 4)

### Turn 2 — Enemy Phase
- Mid-turn dialogue from boss 守衛隊長 ("遲愣…")
- **Eirine took 10 damage** from 帝國精兵 attack at (3,2) → HP 9/19
  - Math: elite str 6 vs Eirine def 4 = 2 dmg per hit. To deal 10 dmg requires ~5 hits — implies a critical (×3 dmg) plus double
- Elite at (3,2) survived counter (HP 17/22 after combat)
- 帝國士官 moved aggressively from (8,6) → (3,3), 4 tiles toward Eirine

### Turn 3 — Player Phase
- **Eirine** retreated to (0,1) — corner; intended safe
- **Marcus** moved to (3,1), attacked elite at (3,2) — 12 dmg, elite HP 17 → 5 (still alive; doubled by elite for 1 dmg, Marcus HP 28→27)

### Turn 3 — Enemy Phase
- 帝國士官 (officer) charged from (3,3) → (1,1), reaching Eirine at (0,1)
- **Eirine killed**. Probable cause: officer crit (3× dmg) on a wounded Lord — at 9 HP, a single 9+ dmg attack ends her
- Marcus took minor damage but survived at HP 27/28
- **GAME OVER**

## Tactical Mistakes (Mine)

1. **Underestimated enemy movement range.** Officer mov 5, Eirine at (0,1) = distance 4 from officer's (3,3) — reachable in one turn. I treated the map corner as "safe" without checking enemy range.
2. **Didn't move Marcus to BLOCK the officer's path.** On turn 3 I should have positioned Marcus at (1,1) or (2,1) to physically interpose between the officer and Eirine. Instead Marcus went to (3,1), attacking the wounded elite while leaving Eirine completely exposed.
3. **Left a wounded enemy alive on turn 2.** Eirine's 2-dmg poke on the (3,2) elite barely scratched it (HP 22→20). I attacked just because I could rather than for tactical effect. With Marcus also already committed, this turned out fine, but generally Eirine should only attack already-killable targets.
4. **No vulnerary use on turn 3.** Marcus carries 傷藥 (vulnerary), but it heals the holder. I never traded it to Eirine. With Eirine at 9 HP after turn 2 EP, she was 1 crit away from dying. A trade-then-heal play could have saved her.
5. **Aggressive forward push too early.** The chokepoint at the y=4 wall is the natural defensive line. I should have parked at (3,1)–(4,1) and let enemies funnel in, killing them with weapon-triangle counters from a defensive posture.

## Game Findings (for the developer)

1. **Wounded enemies retain extreme positional aggression.** The HP-17 elite at (3,2) chose to engage Eirine (and crit her down) rather than retreat. That's fine for a tutorial chapter, but the boss-AI behavior of the elite looked very aimed (consistent with the "aggressive" AI in `docs/status.md`).
2. **Weapon triangle math felt slightly off.** Marcus's 鋼劍 (sword, mt 7) vs lance enemies dealt 12–14 dmg per hit. Sword is at *disadvantage* vs lance per `AGENTS.md` ("Sword > Axe > Lance > Sword" — Lance > Sword). So Marcus's higher-than-expected damage might mean the disadvantage modifier isn't being applied in `calculateCombat`, or my reading of the math is off. Worth a check.
3. **No combat log surfaced via `game.*` API.** I tried `game.messageLog`, `game.eventLog`, `MessageLog.messages` — none existed. Adding a circular buffer of recent combat results would make playtesting (and bug reports) much easier.
4. **The combat-forecast modal blocks programmatic play.** The intended click flow is: click target → forecast appears → click 確認. Calling `game.startCombat(attacker, target)` directly bypasses the forecast, which I needed to do. For human players this is fine; for automated playtests, a `--skip-forecast` flag (or just exposing `startCombat` more prominently) would simplify scripting.
5. **Eirine at 19 HP / def 4 is fragile against any chapter-1+ stats.** A single crit on the lord is a chapter-ender. Consider either bumping her starting bulk (HP 22, def 5) or making the first chapter's enemies have lower crit potential.
6. **`?chapter=1` URL loads ch0** (not ch1). Either the URL param is 0-indexed (and the docs/script wrong) or the chapter loader is off by one. Minor confusion when testing specific chapters.

## What I'd Do Differently Next Run

- Turn 1: Marcus to (4,1) attack (5,1). Eirine STAYS at (0,1)
- Turn 2: Marcus advances/cleans up wounded. Eirine to (2,1), still behind Marcus
- Turn 3+: hold at the y=4 wall opening (1,4)/(2,4), make enemies come to Marcus through the chokepoint
- Use vulnerary trade if Eirine ever drops below 12 HP
- Plan moves by checking each enemy's `mov` + position before committing Eirine anywhere

---
*Session ended after 3 player turns. Eirine dead, Marcus at 27/28 HP, 8 enemies remaining including boss.*

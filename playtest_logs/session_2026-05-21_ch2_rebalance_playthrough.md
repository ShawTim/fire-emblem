# Ch2 Rebalance Playthrough — Reinforcement Cut → Seize-Rush Exploit → Seal Fix

**Date:** 2026-05-21 (follow-up to session_2026-05-20b_ch2_large_circle.md)
**Build:** master, ch2 large-circle layout
**Outcome:** First headless playthrough LOST on T6. Cut reinforcements 12→7. Re-playthrough WON on
T3 with 0 casualties — but the win bypassed the boss and 15 of 16 other enemies, exposing a
seize-objective exploit. Seize tile then **sealed** (boss + 4 guards wall it); the
mandatory-boss re-playthrough **LOST on T5** (lord killed by the reinforcement swarm).

**Follow-up 2026-05-22 (Run 4):** the patient-strategy re-run **WON on Turn 23** with 1
casualty — ch2 *is* winnable post-seal-fix, but the win exposes that the mandatory boss is
a range-1 unit that can be cheesed from range 2 for zero risk. See Run 4 below.

## Session arc

1. Played the large-circle ch2 headless → **lost on Turn 6** (lord killed by the reinforcement swarm).
2. User: "Apply a rebalance pass."
3. Cut reinforcements, removed the both-sides pincer waves.
4. Re-playtested → **won on Turn 3** — but the win exposed the seize-rush exploit (below).
5. User chose to **seal the seize tile** (boss + 4 guards on (10,2) and its 4 neighbours).
6. Re-playtested the now-mandatory boss fight → **lost on Turn 5** (lord killed by the swarm).

## Run 1 — loss (pre-rebalance)

Played ch2 as a fight-through-everything chapter: split the party to chase corner reward houses;
lost Lina T4 (walked into a defensive guard's static range), lost Eirine + Marcus T6 to the
T2/T3 reinforcement swarm converging on the now-isolated, split party. Lord dead → game over.

Honest split: ~40% my tactical errors (party-splitting, mispositioning fragile Lina); ~60% design —
14 base + 12 reinforcements = a 26-enemy chapter for a 5-unit party, with both-sides pincer waves
that punish any split.

## Rebalance applied (`maps/ch2_village/config.json`)

Reinforcements **12 → 7**; both-sides pincer waves removed:

| Turn | Before | After |
| --- | --- | --- |
| T2 | 2 soldiers (1,11)+(16,11) | unchanged (2) |
| T3 | 2 soldiers (2,4)+(15,4) + archer | **1 soldier (15,4)** |
| T4 | 2 archers (2,9)+(15,9) + fighter | **archer (15,9) + fighter (9,12)** |
| T6 | knight + soldier | unchanged (2) |
| T7 | 2 fighters (3,9)+(14,9) | **removed** |

Base roster unchanged (14: boss + 4 manor guards + 9 looters).

## Run 2 — win (post-rebalance)

Strategy change: keep the party together, ignore the looters/villages, **b-line the seize tile (10,2)**.

| Turn | Player phase | Enemy phase |
| --- | --- | --- |
| T1 | Advance the party as one compact block to y=4-5 staging (every tile ≥3 from any manor defender) | 0 damage — all 14 base enemies stationary |
| T2 | Marcus + Lina focus the soldier standing ON the seize tile (10,2): 10+4 → 12 HP | soldier hits Marcus 7 / Marcus counters 10 → soldier 2 HP; archer (12,3) chips Marcus → Marcus 9/28 |
| T3 | Lina kills the 2-HP soldier (range 2, no counter); Eirine walks onto (10,2) and seizes | **VICTORY** |

**Final:** Turn 3, **0 casualties** — Eirine 22/22, Marcus 9/28, Lina 17/17, Thor 24/24, Serra 16/16.
Enemies killed: **1**. Untouched at victory: 16 (boss, 3 manor guards, 9 looters, 3 reinforcements).

## Key finding — the seize objective is exploitable

The chapter is winnable in 3 turns by killing exactly one enemy. Three things combine:

1. **Defensive AI never moves.** All 13 non-reinforcement enemies + boss are `defensive`/`boss` —
   they never chase and never body-block. The lane up the centre to (10,2) is open from T1 and
   stays open.
2. **The seize tile is uncontested.** (10,2) only has a soldier standing on it; its four
   neighbours — (9,2),(11,2),(10,1),(10,3) — are empty. Once that soldier dies, (10,2) sits at
   distance ≥2 from every remaining enemy: the boss (9,1) is range 1 at distance 2, both archers
   are range 2 at distance ≥3. Nothing can attack the tile.
3. **`doSeize()` → `onChapterClear()` fires immediately**, with no enemy phase between reaching
   the tile and winning. Even a contested tile wouldn't help — you win before any enemy acts.

So the reinforcement rebalance is nearly moot for a rushing player: they never meet the
reinforcements, the boss, or the garrison. The honest "fight the garrison" path (which lost Run 1)
was **not** re-tested post-rebalance — whether that path is now fair remains an open question.

**Objective mismatch:** `objectiveDesc` promises "擊破百夫長並制壓村中央指揮點" (defeat the centurion
**and** seize the command point), but the coded objective is `seize` only — `checkWinCondition`
(`js/game/ai-turn.js:115-121`) never checks the boss.

## Recommendations (for the user to decide)

- **If ch2 should be a seize race:** wall the seize tile off so it can't be reached without a fight.
  The robust map fix is to occupy all four neighbours of (10,2) — (9,2),(11,2),(10,1),(10,3) — with
  tanky units (boss + guards), so opening any entry requires killing an occupant and eating the
  others' attacks. Repositioning the existing garrison beats stat-tuning here.
- **If the intent is literally "defeat the boss AND seize"** (as the description says): add a
  combined win check to the engine (`seize` AND boss dead), or apply the map fix above so the boss
  physically can't be skipped.
- **Reinforcement count (7)** looks reasonable for the honest path but is untested in real play
  post-rebalance — flag for a follow-up pass if the seize exploit is closed.

## Carry-over caveats

- Boss never engaged this run. Still un-doublable (spd 8 vs Eirine spd 9); Eirine's rapier is
  ×3-effective vs the armored boss (forecast 11/hit, ~3 hits to kill).
- Looters confirmed stationary every enemy phase — 4th consecutive session verifying the "busy
  looting" defensive design holds.

---

# Run 3 — Seal Fix + Mandatory-Boss Re-playthrough (LOST T5)

## Seal-fix applied (`maps/ch2_village/config.json`)

User picked **"封住制壓點"** — the robust map fix recommended above. The boss and 4 guards are
positioned so the seize tile **and all four cardinal neighbours are occupied**:

| Unit | Class / AI | Pos | Role |
| --- | --- | --- | --- |
| 帝國百夫長 (boss) | knight / `boss` | (10,2) | sits **on** the seize tile |
| 帝國槍兵 | soldier / `defensive` | (10,1) | N neighbour |
| 帝國槍兵 | soldier / `defensive` | (10,3) | S neighbour |
| 帝國弓兵 | archer / `defensive` | (9,2) | W neighbour |
| 帝國弓兵 | archer / `defensive` | (11,2) | E neighbour |

(10,2) can no longer be reached without killing ≥1 of the 5 — **the boss fight is now mandatory.**
Reinforcements still 7; 9 looters unchanged.

## Run 3 — headless, turn by turn

Played the honest fight-through path (seize-rush is closed).

| Turn | Summary |
| --- | --- |
| T1–T2 | Advance the compact party north toward the cluster; Thor + Serra join T1. |
| T3 | Open the cluster from the west — Marcus + Thor + Eirine focus the W archer (9,2); Eirine **crits** and kills it. |
| T4 | Marcus + Eirine chip the E archer (11,2) → 12 HP; the T2/T3 aggressive reinforcements arrive and converge on the party. |
| T5 | Pocket Eirine (11 HP, lord) into walled tile (11,1), healed to 22, to survive the swarm. **Enemy phase: Eirine killed → game over.** |

**The fatal T5 enemy phase:**
- 帝國槍兵 (N soldier, 10,1) → Eirine: **HIT 11**
- 帝國增援 (reinforcement, 12,1) → Eirine: **HIT 11 [KILL]** — Eirine 22 → 0.
- `checkLoseCondition` true (lord dead) → chapter lost on Turn 5.

## Why Eirine died — 2 estimation errors + 1 genuine difficulty

1. **Lance-vs-sword.** I estimated the (10,1) soldier would do ~6 to Eirine (it did 6 to def-9
   Marcus earlier). It did **11**: Eirine has def 5 (−4) **and** her rapier is at weapon-triangle
   *disadvantage* vs the soldier's lance. The entire imperial army wields lances — every soldier
   hits the sword-lord hard.
2. **Range-2 ignores walls.** I placed Serra on (11,0) thinking it body-blocked; archer (11,2)
   has **range 2** and (11,0) is exactly 2 tiles away — Serra was shot for 13 (survived at 3).
3. **No fully-walled pocket exists.** The pocket left one open tile (12,1) beside Eirine.
   soldier 11 + one reinforcement 11 = 22 = exactly Eirine's max HP — **even healed to full she
   died.** Surviving needed *zero* reinforcements adjacent (all 4 neighbour tiles walled), which
   the cluster's own geometry made impossible to set up with a 5-unit party.

## Assessment — is the chapter winnable?

**This run: no.** Part of the loss is my misplay — I engaged the *stationary* cluster on T3–T4
**while** the aggressive reinforcements were inbound, creating a two-front fight that pinched the
5-unit party. A cleaner line was available and untried:

> The boss cluster is **100% stationary** (boss + 4 guards are `boss`/`defensive` — verified all
> session, never move). It waits forever. A patient player holds a compact formation *outside
> archer range*, lets the 5 aggressive reinforcements come piecemeal, kills them with focus-fire
> while Marcus / Thor (def 9 / axe-beats-lance) tank — and only **then** approaches the cluster,
> full party, no time pressure.

So the chapter is *probably* winnable with optimal play, but:

- A player making the **natural choice** ("advance and fight the garrison") walks into the same
  two-front loss.
- The seal-fix correctly closes the seize-rush, but it also made the boss fight mandatory
  **without cutting reinforcements** — the 12→7 cut was calibrated for a chapter where a rusher
  *skips* most enemies. With nothing skippable, cluster (5) + reinforcements (7) on the honest
  path is a steep 12-enemy gauntlet for 5 units.
- The rapier lord is the **only** unit that meaningfully damages the armored boss (~11/hit), yet
  she is the most fragile vs the all-lance enemy army and the boss's 17-damage counter. The
  chapter forces the squishy lord into the line of fire.

## Recommendations (for the user to decide)

Keep the seal-fix — it is sound. But pair it with a difficulty pass on the honest path:

- **Cut reinforcements again (7 → 3–4).** The 12→7 cut assumed rushers skip the garrison; that
  assumption is now false. Fewer reinforcements is the cleanest lever.
- **Or delay the early waves** — push the T2/T3 reinforcements later so the player can break the
  cluster before the swarm lands, removing the two-front pinch.
- **Or soften the boss `bonusStats`** (`hp+5 / str+2 / def+3`) — the +3 def and the 17-damage
  counter make the mandatory boss a long, dangerous grind for the fragile lord.
- **Confirm winnability:** a patient-strategy headless re-run is still needed to *prove* the
  chapter is beatable post-seal-fix. Run 3 does not establish that.

---

# Run 4 — Patient-Strategy Re-run (WON T23)

**Date:** 2026-05-22
**Build:** master, ch2 seal-fix layout — config **unchanged** from Run 3 (no rebalance
applied; this run is a pure winnability check).
**Outcome:** The patient line **WON on Turn 23** — the first victory on the honest
(non-rush) post-seal-fix path. ch2 *is* winnable. Cost: **1 casualty** — Serra, the
party's only healer, died on Turn 9. Final survivors at the seize: Eirine 9/22,
Marcus 18/28, Lina 17/17, Thor 24/25.

This resolves the open question from Run 3 ("a patient-strategy re-run is still needed to
*prove* the chapter is beatable"). It is beatable — but the win shows the seal-fix's
"mandatory boss fight" is not a fight.

## The run in two phases

### Turns 1–10 — the reinforcement gauntlet (the run was nearly lost here)

Patient plan as intended: hold a compact formation, let the 5 aggressive reinforcements
arrive piecemeal, focus-fire them with Thor/Marcus tanking. It worked for the swarm but
cost Serra and left Eirine crippled. Two of my errors + one genuine difficulty:

- **T8 — retreated into a looter's static range.** Pulled the party into the SW corner
  without accounting for the *stationary* looters already sitting there. Defensive looters
  don't chase, but they DO attack anything that enters their static range — the thunder
  mage @(3,10) hit Eirine for **13** (22 → 9). Eirine spent the entire rest of the run at
  9 HP because of this.
- **T9 — Serra placed in 帝國精銳's reach with no forecast.** Parked the 17-HP cleric
  (def ≈ 0) where the T6 reinforcement 帝國精銳 could reach, on the untested assumption
  "a squishy survives one hit." Enemy phase: 帝國精銳 **HIT Serra for 18 [KILL]** — a
  clean one-shot. My estimation error — but also a real balance point: a single T6
  reinforcement one-shots the only healer, and with three fragile units
  (Lina/Marcus/Serra) all inside 帝國精銳's move-5 reach, a 5-unit party could not keep
  every squishy out of range.
- 帝國精銳 was then ground down (Thor EP-counters T7–T8, Lina pokes T9–T10) and dead by
  T10. After T10, **every** surviving enemy is stationary or river-trapped — the rest of
  the run had unlimited tempo.

### Turns 11–23 — the boss cluster (zero damage taken)

| Turn | Action | Result |
| --- | --- | --- |
| T11–T14 | Thor handAxe-pokes S guard 帝國槍兵 (10,3) from (10,5), range 2 | 9 dmg/hit, no counter, no EP reprisal — dead in 3 hits (+1 miss) |
| T15–T23 | Thor handAxe-pokes the boss from (10,4), range 2 (T15's EP doubled as the boss range test — no reprisal at distance 2) | 5 dmg/hit, no counter — boss 33→0 over 9 turns (7 hits, 2 misses) |
| T23 | Eirine walks (10,6)→(10,2) up the cleared southern lane and seizes | **VICTORY** |

**Damage taken across turns 11–23: zero.** Thor leveled once mid-poke. Eirine never
fought the boss at all — she only walked onto the vacated tile.

## Key finding — the boss's javelin never fires; the boss is a range-1 unit

The boss config is `items: ["steelLance","javelin"]`. The javelin (手槍) is range 1–2.
But `getEquippedWeapon()` (`js/unit.js:93-102`) walks `items[]` in order and returns the
**first usable weapon** — it is *not* range-aware. The boss therefore always equips
`items[0]` = steelLance (range 1); `items[1]` = javelin is **never reached**.
`getAttackRange()` (`js/unit.js:104-108`) then reports `[1]` for both attacking and
countering.

Verified empirically: Thor attacked the boss from range 2 on **9 turns** — every forecast
and every hit showed `counter: none`, and on every one of the boss's enemy phases (Thor
parked at distance 2) the boss **did not attack**. The boss cannot act at range 2 at all.

Two consequences, both bad for the seal-fix's intent:

1. **A range-1 boss walled in by its own guards is inert.** All four neighbours of (10,2)
   — (9,2),(11,2),(10,1),(10,3) — are occupied by the boss's own guards (the seal-fix
   layout). With nothing it can reach, the boss never attacks until *you* clear a tile.
2. **It can be killed from range 2 at zero risk.** Clear one guard from range 2, then poke
   the 33-HP boss from distance 2 with any range-2 attacker (hand-axe, javelin, or bow —
   here Thor's hand-axe). No counter, no enemy-phase reprisal. Eirine — the intended
   ×3-effective boss-killer — is not needed at all.

## Other confirmations

- **帝國突擊兵 (T4 aggressive fighter) is permanently river-trapped.** It spawned south of
  the all-`R` river row (y11, passable only at x16–17); it sat at (3,12) and **never moved
  once** across turns 10–23. An aggressive reinforcement that the map geometry fully
  neutralises — effectively a free 1-enemy discount on the honest path.
- All 9 looters and the rest of the cluster confirmed stationary the whole run.
- Enemies killed this run: **6** (4 reinforcements in T1–10, + boss + 1 cluster guard).
  **15 survive** at the seize — the win bypasses the N guard, both archers, 帝國近衛,
  9 looters and 帝國弓增援. (Seize fires `onChapterClear()` instantly, no EP — the live
  guards never get to act.)

## Assessment — the seal-fix closed the rush but built a non-fight

The seal-fix correctly kills the seize-RUSH (Run 2). But the boss fight it makes mandatory
is not a fight:

- The boss is range-1, boxed in by its own guards → inert until you choose to engage.
- One guard cleared + ~9 turns of free range-2 poking = a zero-risk 33-HP kill.
- Net effect: the mandatory boss fight adds **~13 turns of tedium, not difficulty**.

The genuine difficulty of ch2 is still entirely in **turns 1–10** — the reinforcement
gauntlet — exactly as Run 3 concluded. The cluster is a formality.

## Recommendations (updated — for the user to decide)

Run 3's reinforcement recommendations still stand. Adding:

- **Make the boss's javelin actually function.** Quick data fix: order the boss's items
  `["javelin","steelLance"]` so it equips a 1–2-range weapon (it will hit slightly softer
  at range 1 — javelin might < steelLance — but gains range 2). Proper fix: make
  `getEquippedWeapon()` range-aware so a unit picks a weapon that can reach the current
  target. As written, **any AI unit's 2nd+ weapon slot is dead data.**
- **Even a working javelin doesn't fully save the fight.** A stationary boss walled by its
  own guards is still poke-able from range 2, just at a small cost. If the boss is meant
  to be a real fight, give a cluster guard a longbow (range 2–3, punishes range-2 pokers)
  or flip the boss to `aggressive` once a guard dies, so it cannot be cheesed in place.
- **Trim or delay reinforcements.** 帝國精銳 one-shotting the 17-HP cleric (18 dmg) was
  the direct cause of the run's only casualty. If the cleric is meant to be protectable,
  soften that wave or delay it.
- **Pacing.** A 23-turn win that is 13 turns of riskless poking is poor pacing. Closing
  the range-2 poke and trimming reinforcements would let ch2 resolve in a tighter window.

## Bottom line

ch2 post-seal-fix is **winnable** — proven, WON T23. But it is won the way Run 4 won it:
survive the T1–10 swarm, then trivially cheese an inert, range-locked boss. The seal-fix
solved the rush exploit; it did not produce a real boss fight.

---

# Rebalance applied — 2026-05-23 (post-Run 4)

User decisions on the Run 4 findings, applied to `maps/ch2_village/config.json`:

| Issue (Run 4) | Fix applied |
| --- | --- |
| Boss javelin never fires — boss stuck at range 1, cheesable from range 2 | Boss `items` reordered `["steelLance","javelin"]` → `["javelin","steelLance"]`. `getEquippedWeapon()` (`js/unit.js:93`) returns the first usable weapon, so the boss now equips the **javelin → range 1–2**; it counters and EP-attacks range-2 pokers. Trade-off: javelin (might 6, hit 65) is weaker than the steel lance, so the boss hits softer at range 1. |
| T1–10 swarm too heavy for the now-mandatory honest path | Reinforcements **7 → 4**. T4 wave **removed** entirely (帝國弓增援 archer + 帝國突擊兵 fighter). T6 wave **trimmed to 1** — 帝國精銳 (the soldier that one-shot the cleric) removed; 帝國近衛 knight kept. |
| 帝國突擊兵 spawned river-trapped at (9,12), never engaged | Resolved by the T4-wave removal above. |

Reinforcements now: **T2 ×2 soldiers, T3 ×1 soldier, T6 ×1 knight (帝國近衛)** = 4. The
seal-fix cluster layout (boss + 4 guards on (10,2) and neighbours) is **unchanged**.

---

# Run 5 — Post-rebalance Honest-Path Re-run (WON T15)

**Date:** 2026-05-23
**Build:** master, ch2 with the 2026-05-23 rebalance (boss `["javelin","steelLance"]`,
reinforcements 7 → 4).
**Outcome:** **WON on Turn 15 with 0 casualties.** All 5 units survived. The boss was
killed in a melee siege at (9,2) over T11–T14 — no range-2 cheese this run, the javelin
counter is now live.

Final: Eirine 11/22 (Lv1), Marcus 20/28 (Lv2), Lina 17/17, Thor 6/26 (Lv5), Serra 4/17
(Lv4). Marcus and Thor both leveled. 1 of 7 villages visited (`(6,7)` vulnerary, the
only ungarded one — the other 6 are sitting under defensive looters).

## The run in three phases

### Turns 1–6 — survive the reinforcement gauntlet

The party advanced compact to the y=4–5 staging zone. The T2 wave (×2 soldiers from
(1,11)+(16,11)) and T3 wave (×1 soldier from (15,4)) came in piecemeal as expected.

- **T3 crisis** — the T3 (15,4) reinforcement moved to (12,3) and attacked **Marcus** (not
  Thor as I'd estimated): 6 dmg → Marcus 6/28, with the boss's javelin still threatening
  8 more on EP. Pulled Marcus north-around through (7,1) (the only path Marcus's mov-8
  could thread out of the cluster's range), vulnerary'd back to 16. Genuine close call —
  another 8-dmg hit and Marcus dies T3.
- T6 — Serra to (8,3) **heal Eirine** 11→22 (Eirine had taken 11 from the (8,5)
  aggressive reinf the prior EP); Marcus killed the (9,4) reinf for the kill bonus.
  Eirine fully topped up.

### Turn 7 — the Serra sideline

T6 EP played the hidden cost: I'd parked Serra at (8,3) right after she healed,
without forecasting the **W archer at (9,2)**. Bow range 2, dist 1+1=2 — **HIT 13**,
Serra 17 → 4. Serra spent T7 onward retreating to (5,5) and was useless for the rest of
the run. Same class of error as Run 4 T9 (Serra placed in range without forecast), but
with smaller fallout (she lived).

### Turns 8–14 — the boss-cluster siege

Honest melee on the cluster, no range-2 poke option this time. Key beats:

| Turn | Action | Result |
| --- | --- | --- |
| T8 | Thor → (12,2), iron-axe melee on (11,2) E archer (6 HP) | KILL. Thor Lv5. EP: boss javelin range 2 → Thor 11 dmg, Thor 6/26 |
| T9 | Thor retreats (12,2)→(13,4); Marcus advances to (8,2), iron-lance at W archer (9,2) | Marcus **missed the 95%**. Boss EP: missed back. |
| T10 | Marcus stays (8,2), iron-lance at W archer again | **CRIT (30 dmg)** — W archer 26→0 one-shot. Boss EP missed again. |
| T11 | Marcus → (9,2) adj boss, iron-lance attack | 6 dmg + boss counter 8 → boss 33→27, Marcus 26→18. Lina visited (6,7) village = +1 vulnerary (held by Lina) |
| T12 | Marcus attack (still (9,2)) | 6 dmg + boss counter MISS → boss 21. EP: boss HIT 8 + Marcus counter HIT 6 → boss 15, Marcus 10/28 |
| T13 | Marcus **vulnerary** → 20/28 (used Marcus's 2nd vulnerary) | EP: boss MISS, Marcus counter HIT 6 → boss 9 |
| T14 | Marcus melee attack | HIT 6 [KILL] — boss 0. Marcus Lv2. |
| T15 | Eirine paths (8,4)→(9,4)→(10,4)→(11,4)→(11,3)→(11,2)→(10,2), seizes | **VICTORY** |

## Verifying the rebalance landed

**Boss javelin works.** The boss countered Marcus on every adjacent attack (8 dmg, 63%)
and attacked Marcus from range 2 on EP at (8,2) (8 dmg, 63%) — the steelLance→javelin
swap fixed the cheese exposed in Run 4. Marcus's melee siege traded ~12 dmg/turn out
for ~10 dmg/turn in (Marcus's range-1 counter on the boss's EP attack was decisive —
it nearly doubled his damage output per turn cycle). The race math was: boss 33 / 11
≈ 3 turns to kill, Marcus 26 + 10 vul / 10 ≈ 3.6 turns to die. Tight but winnable, and
the boss's two missed counters + one missed EP attack across T11–T13 gave Marcus the
breathing room he needed.

**4-reinforcement load is fair.** All three early reinforcement waves resolved by T6.
帝國近衛 (T6 knight @(9,0), defensive, kept from Run 4's trim) never moved — no
player ever entered its range 1 — confirming a defensive T6 knight in that slot is a
non-event. Could be cut for a cleaner load, or moved to a position that actually
threatens the cluster approach.

## Two surprises

1. **Marcus's T10 crit was decisive.** W archer at 26 HP would otherwise need 3 hits
   (10 dmg each) over T9–T11, costing Marcus ~24 dmg from boss counter+EP across those
   turns — likely killing him before the cluster opened. The crit (Marcus skl 12, ~3%
   per attack) compressed the W-archer phase to a single hit. Without it the run is
   probably a loss or a much longer slog.
2. **The chip-with-the-lord trap.** Eirine's rapier at +3 vs armored boss would be the
   obvious DPS pick, but her def 5 and lance-vs-sword disadvantage mean the boss hits
   her for ~13/counter. Eirine cannot survive the siege; Marcus's neutral lance vs lance
   matchup (def 9, counter every turn) is the real boss-killer. The rapier remains
   theoretical.

## Assessment — the rebalance worked, but the cluster is still a Marcus solo

ch2 post-2026-05-23 rebalance is **winnable, fair, and the boss is now a real fight**.
Run 4's range-2 cheese is closed. The 4-reinforcement load is the right tempo — three
waves resolved by T6, then the cluster.

But the boss fight is still effectively **Marcus vs the boss 1-on-1 at melee**, because:
- Eirine (the supposed boss-killer) is too fragile to tank the counter.
- Thor's axe is range 1 only (his hand-axe was already used up before T8) and his def 5
  makes him equally fragile.
- Lina's bow chip from range 2 gets countered by the W archer at (9,2) (now alive again
  in this layout — different from Run 4 where the W archer was killed first).
- The W and E archers cover the entire approach lane: any tile dist 2 from (10,2) is
  also dist ≤2 from a cluster archer, so anyone but Marcus melee-tanking takes archer
  counter.

So the cluster forces the player into a single solution: clear one archer (with Marcus
+ luck on crit or hit rate), move into that archer's spot, melee the boss. It works —
Run 5 proves it — but the variation is narrow.

## Open question — is "Marcus only kills the boss" the intended design?

Run 5's win rests on Marcus's 92%-hit, 6-dmg iron-lance attacks landing 5+ times over
T11–T14 *and* the boss's 63%-hit counter missing enough to keep Marcus alive. The
expected race is ~3 turns each side; the actual run worked because the boss missed 2 of
4 attacks. With average rolls, Marcus dies on T13 with the boss at ~12 HP and the
chapter is lost. **Run 5 is winnable but variance-heavy.**

If the design intent is "Marcus is the boss-killer," this is fine. If the intent was
"Eirine kills the boss with her rapier," the chapter never delivers it — she cannot
get into melee and survive. If the intent was "the whole party contributes to the boss
fight," the cluster geometry actively prevents it.

## Recommendations (for the user to decide)

- **The rebalance is good — keep it.** Mandatory boss fight is now real, reinforcement
  load is honest, run is winnable.
- **Consider softening the boss's counter hit rate** (skl 8 → 6, drops 63% → ~55%) if
  variance is meant to be lower. Marcus's race vs boss is currently knife-edge.
- **Or: change the cluster's approach geometry** so multiple players can contribute to
  the boss fight. Moving one archer or one lance soldier would crack the lane open.
- **Or: give the boss a bigger weakness for Eirine** (e.g., a slayer effect) so the
  rapier matters — currently the rapier is in the chapter mostly as flavor.
- **Drop the T6 帝國近衛 reinforcement** if no further difficulty is wanted; it never
  engaged in Run 5.

## Caveat — level-progression check (added post-Run 5)

Run 5 used Lv1 Eirine/Marcus/Lina, since the harness loads ch2 with base-level units.
A real player arriving at ch2 has ch0+ch1 EXP banked, so the natural question was
whether Run 5's "knife-edge" boss race is artificially harsh. Estimating the actual
post-ch0+ch1 levels:

**Marcus barely levels.** Paladin is `promoted: true` (`js/data/chapters.js:7`), so
`calculateExp()` (`js/combat.js:138-160`) gives him `atkEffLevel = level + 20`. Against
typical ch0/ch1 enemies at Lv2-3, the level diff is -19:
- Non-kill hit: **1 EXP**
- Kill: **10 EXP** (formula floors at 10)
- ch1 boss kill: **50 EXP** (10 + boss bonus 40)

So Marcus banks roughly 80-100 EXP across ch0+ch1 → **0-1 level-ups**. Even at Lv2
his low growths (hp 40%, str 20%, skl 20%, def 15%) give him maybe +0.5 of each stat
— statistically a wash. Run 5's Marcus@Lv1 is the realistic case, **not the worst
case**. He's a classic Jagen archetype: pre-promoted crutch, capped scaling, intended
to be surpassed.

**Eirine and Lina level normally** (unpromoted). Eirine probably arrives ch2 at Lv2-3,
Lina at Lv1-2. Eirine gains noticeable stats (high growths: hp 75%, str/skl 50%, spd
60%) — maybe +2 HP, +1-2 str, +1-2 skl, +2 spd over base. But she still can't tank
the boss's javelin counter (def 5 → ~6 doesn't change the math vs str 11 + 7 mt = 13
incoming), so the cluster geometry still keeps her out of melee.

**Net effect on the boss race:** essentially unchanged from Run 5. The boss-killer is
Marcus, Marcus doesn't scale, and Eirine getting +2 HP/spd doesn't open new tactical
options on the cluster. So:

- The "knife-edge variance" of the boss fight is **structural**, not an artifact of
  testing at Lv1. A real player faces the same race.
- The "**soften boss skl 8→6**" recommendation is therefore the most important one
  — it's the only lever that addresses variance without changing geometry, and Marcus
  cannot scale his way out.
- The other recommendations (cut T6 knight, crack cluster geometry, slayer for rapier)
  all remain valid at any party level.

## Bottom line

Run 5 closes the question opened by Run 4: the 2026-05-23 rebalance produces a winnable,
honest ch2 with a real boss fight — proven, WON T15 with 0 casualties. The boss now
counters at range 1 and EP-attacks at range 2 (javelin working as intended). The
4-reinforcement load is tight but fair. The remaining design wrinkle is that the boss
fight is a 1v1 melee race that only Marcus can run, which the player has to either
crit-fish or get lucky on misses to win — and Marcus's Jagen EXP cap means he can't
level his way past this. The chapter is no longer broken in either direction (rush
exploit or cheese-poke), and the honest path produces a clean victory, but variance
is best addressed at the boss's skl stat, not by trusting the player to grow Marcus.

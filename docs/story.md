# Story & World

## World

**Continent:** 艾爾德拉（Eldra）

A thousand years ago five stars fell and became five **Star Crests** (星印), each granting elemental power to its bearer. The five kingdoms each held one crest and kept a thousand-year peace. The five were Elfaria (艾爾法利亞), Askar (阿斯卡), Eirmela (艾爾梅拉, technically a free city-state under shared protection), and two others.

A sixth star — the **Verdant Star** (翠星) — hid in a crack in the world. When imperial chancellor **Morgane** (莫爾甘) discovered its existence, he staged a coup, aiming to gather all six crests and ascend to godhood.

The story follows Princess **Eirine** (艾琳) of the Elfaria Kingdom, who is forced to flee the palace on the night of the coup and begins a resistance campaign to reclaim her kingdom.

### Morgane's true identity (canon, revealed ch10)

Morgane is the **half-brother** of the late King — Eirine's biological uncle. His mother was a 樂坊女子 (court musician), and 祖王 (the previous king) declared his blood "unclean" and exiled him from the royal house. The late King knew but never spoke up to defend him. Morgane carries the same Star Crest bloodline as Eirine — which is why the Star Crest responds to him at all, and why his thirty-year quest for it is also a long grievance against the brother who never claimed him. Pre-ch10, this is hidden from every named character; characters refer to him only by name or title.

### The hostage doctrine

Morgane's universal method of command: hold the families of his commanders, soldiers, and officials. Any defection or failure → family executed. This produces the recurring "loyal-but-trapped" antagonist pattern across the campaign (ch0 guardCaptain, ch1 boss, ch5 Glen, ch6 Balsar's circle, ch8 Gerhardt's iron-wall army, ch10 黑鷹近衛). The party gradually learns to read this and to treat the rank-and-file as Morgane's hostages rather than enemies.

---

## Playable Characters

| charId | Name | Class | Joins | Backstory hooks (canon) |
|---|---|---|---|---|
| `eirine` | 艾琳 | Lord | ch0 | Protagonist. Carries the Star Crest. Holds the bloodline that Morgane shares. `isLord=true`. |
| `marcus` | 馬庫斯 | Paladin | ch0 | Veteran knight, Jagen-type. His sister **艾蓮娜 (Elena)** was a refugee who married into Eirmela 30 years ago — killed in the Eirmela massacre 3 days before ch6. |
| `lina` | 莉娜 | Archer | ch1 | Forest hunter. Her mother was an **Askar Kingdom refugee** the empire killed ~10 years ago; Askar's own crest was lost in the same purge. Her vendetta is older than Eirine's. |
| `thor` | 托爾 | Fighter | ch2 | Northern warrior. Drifted years in northern taverns; once drank with the **血色軍團** mercenaries before they sold themselves to the empire (recognizes their insignia in ch4). |
| `serra` | 賽拉 | Cleric | ch2 | Church healer. Genuinely devout. Provides the moral pulse of the party — recites a 往生咒 over enemy dead, including ヘルガ's converted-undead soldiers in ch9. |
| `cain` | 凱恩 | Mercenary | ch3 | Lone swordsman. Former **王宮 knight**; left court after his lover died in a border siege she shouldn't have been at — assigned there during a 官員爭功 dispute. Knows Zeno (ch4) by name from court days. |
| `fran` | 法蘭 | Mage | ch4 | Genius mage. Imprisoned in the magic tower by Zeno for 3 years to research the Star Crest's structure. Stole pieces of Morgane's research notes on her way out; uses them tactically in ch9 and ch10. Vows to burn the rest after final battle. |
| `rex` | 雷克斯 | Wyvern Rider | ch5 | Defected imperial dragon knight. Was a **military-academy student under Glen** — Glen pinned his Wyvern Knights badge on him at graduation, taught him "騎士的劍，是為了不能拿劍的人而舉". Delivers Glen's killing blow himself in ch5. |
| `natasha` | ナターシャ | Pegasus Knight | ch6 | Sky knight from **艾爾梅拉 (Eirmela)**, a free city-state Morgane's army razed 3 days prior — 300 garrison + 2000 civilians, decree said they were "通謀 with Elfaria". Pre-existing tie to Marcus's sister Elena. |
| `olivier` | オリヴィエ | Thief | ch7 | Self-described "回收專家". Family killed by Morgane's people 3 years ago. Since then he steals or recovers anything Morgane wants — including the 翠星之鑰 stone tablet in ch7. Adversarial banter with Cain over "分贓" priority. |
| `helga` | ヘルガ | General | ch8 | Defected imperial general. Was **Gerhardt's apprentice and副將**; rebuked + whipped 20 times for questioning Morgane's order to burn the 翠星之鑰 mural beneath Iron Fortress. Defects because she still respects her teacher — sees Morgane has done something to him. Knows the inside of every imperial fortress doctrine. |

Non-playable important characters:
- `morgane` — final boss; portrait at `portraits/morgane.png`. Speaker for the recurring 星印共鳴 voice scenes (ch0/4/7/8/9/10).
- `king` — Eirine's father, ch0 prologue only. Dies sacrificing himself.
- `guardCaptain` — ch0 antagonist; his wife/children are the first named hostage case.
- Glen's family — 艾莉莎 (wife) / 伊凡 (son) / 蕾娜 (daughter). Eirine promises in ch5 to remember.

---

## Chapter Summaries

### Ch0 序章「墜落之夜」— Fallen Night

- **Map:** Royal palace corridors
- **Objective:** Eirine reaches the exit (seize)
- **Story:** Morgane's coup. The King presses the Star Crest into Eirine's hands and sacrifices himself to let her escape. Marcus escorts her out through a secret passage. The opening scene now shows Morgane arriving in person and stating his intent to gather all five crests in Eirine's hearing — and the king recognizing the betrayal of "三十年的信任". The guardCaptain hunting them down does so because his wife and children are held hostage — establishing the doctrine that will recur through ch5/6/8/10.
- **Recruit:** Eirine, Marcus
- **Boss:** guardCaptain (with hostage-motive bossLines)

---

### Ch1 第一章「荒野的邂逅」— Wilderness Encounter

- **Map:** Forest and plains (荒野)
- **Objective:** Rout all empire pursuers
- **Story:** Fleeing north at dawn, Eirine and Marcus encounter imperial pursuit squads blocking the road. A forest hunter named Lina shoots down a scout and offers to help. Mid-chapter, Lina reveals her mother was killed in the Askar purge and her own family carries the lost Askar crest's grief — this seeds the five-kingdoms lore and pays off in ch10 where she fires "母親之箭" against Morgane's banner. Eirine also recognizes the boss as the same guardCaptain from ch0 — Morgane's pattern of family-hostage commanders is named.
- **Recruit:** Lina (joins pre-battle)
- **Boss:** Same hostage-pattern, ch0 callback

---

### Ch2 第二章「北境之村」— Northern Village

- **Map:** Village under attack
- **Objective:** Seize the command post
- **Story:** Arriving at a northern village to seek supplies, the party finds it under attack by an imperial centurion who treats razing the village as 公務 — establishing the bureaucratic-evil register Morgane has imposed across the empire. Thor holds the gate; Serra is treating his wounds. Together they retake the village. Mid-chapter, a dying soldier humanizes the empire side — Serra carries the moral weight, Lina notes her own mother died similarly, Thor goes pragmatic. Cantonese is used for villager dialogue (the only chapter where this is true).
- **Recruit:** Thor, Serra (join pre-battle)

---

### Ch3 第三章「傭兵的試煉」— Mercenary's Trial

- **Map:** Ruined castle (布倫古城)
- **Objective:** Rout all imperial pursuers
- **Story:** The party finds a ruined castle occupied by mercenaries who refused imperial hire. The empire sends a retaliatory force. Cain joins on turn 1 by parley. Mid-chapter, Cain reveals his court-knight backstory: a lover lost in a border siege she should not have been assigned to, the assignment due to 官員爭功 — explains why he left the palace and why he distrusts authority. He also names Zeno (the ch4 boss) as a court researcher working under Morgane's direct orders, foreshadowing ch4.
- **Recruit:** Cain (turnJoin:1, speaks with Eirine on turn 1)
- **Boss:** 追討騎士長 (Cavalier lv8, hostage-pattern bossLines)

---

### Ch4 第四章「魔法塔」— The Magic Tower

- **Map:** Tall tower interior (14×18), 4 tiers
- **Objective:** Eirine reaches the tower top (seize at x:6,y:0)
- **Story:** The party infiltrates a fog-shrouded ancient tower where Fran, a young genius mage, has been imprisoned for 3 years by Zeno (Morgane's chief researcher) to research the Star Crest's structure. Fran escapes pre-battle and joins. Mid-tower, **Morgane's voice scene** (turn 2) — first instance of the Morgane 星印共鳴 device: he speaks directly into Eirine's mind through the tower's magic circle, taunts her with how her father died "calling Morgane's name". Eirine refuses to be shaken. Turn 3, Zeno summons 屍兵 — Fran identifies the spell. Turn 5, Thor recognizes 血色軍團 insignia from his drifter days.
- **Recruit:** Fran (turnJoin:1, appears at tower top)
- **Boss:** 首席魔導師澤諾 (Dark Mage lv1, bonusStats heavy; bossLines about needing a live sample for crest resonance)

---

### Ch5 第五章「星辰要塞」— Fortress of Stars

- **Map:** River crossing fortress (20×14)
- **Objective:** Defeat the fortress commander (boss kill)
- **Story:** The Starfire Fortress blocks the only river crossing northward. Its legendary commander **Glen** ("帝國之盾") has never been breached. Pre-battle, Eirine parleys — Glen refuses to defect because Morgane has issued a death decree on the families of every soldier inside the fortress. Glen openly asks Eirine to take his head quickly and spare his men. Mid-battle, Rex (a defected wyvern knight) arrives — reveals that Glen was his military-academy instructor, that Glen pinned the Wyvern Knights badge on him personally, taught him "騎士的劍，是為了不能拿劍的人而舉". Rex insists on delivering Glen's killing blow himself. Post-battle, Fran finds Morgane's hostage decree in Glen's軍徽: "失敗者，全家族抄斬". Glen names his family — 艾莉莎 / 伊凡 / 蕾娜 — and Eirine promises to remember.
- **Recruit:** Rex (joins mid-chapter, turn 2)
- **Boss:** 格倫 (paladin, silverLance+javelin, hostage-decree bossLines)

---

### Ch6 第六章「裏切之港」— Port of Betrayal

- **Map:** Coastal port (18×16)
- **Objective:** Seize the port command post
- **Story:** The party heads south to cut the empire's sea supply lines at a major coastal port controlled by **Admiral Balsar** (提督巴爾薩) — who maintains secret pacts with three pirate fleets, openly tolerated by Morgane because the supply chain matters more than the rule of law. Rex identifies a star-crest tracking instrument on Balsar's flagship — Morgane has cast his net to sea. Turn 3, Natasha (pegasus knight) crashes into camp — survivor of **艾爾梅拉 (Eirmela)**, a free city-state Morgane's army razed 3 days prior (300 garrison + 2000 civilians, decree cited "通謀 with Elfaria from 30 years ago"). Then the gut-punch: **Marcus's sister 艾蓮娜 (Elena)** married into Eirmela 30 years ago and died in that same massacre. Marcus learns of her death in this scene. Natasha and Rex pair off in shared revenge. Balsar in his bossLines admits razing Eirmela "last week" was just public service for Morgane's promotion.
- **Recruit:** Natasha (turnJoin:3)
- **Boss:** 提督巴爾薩 (Archer lv9, killerBow, opportunist bossLines)

---

### Ch7 第七章「深淵之森」— Forest of the Abyss

- **Map:** Ancient dark forest (20×16)
- **Objective:** Rout all enemies
- **Story:** The party enters the 深淵之森, a forest thick with dark magic where brigands and dark mages serve an entity called the Lord of the Abyss. The empire sent agents to find an ancient stone tablet — the **翠星之鑰 (Verdant Star Key)** — that points to the Verdant Star Temple. Turn 1, Fran detects the forest has 20× normal magic density; turn 2, **second Morgane voice scene** — Morgane personally speaks to the boss Aegnis through the magic resonance, ordering him to hold the tablet until Eirine arrives so she can be sacrificed at the altar. Turn 4, **Olivier** (thief, "回收專家") emerges from a village hut already carrying the tablet — he stole it from under Aegnis's altar. His backstory: family killed by Morgane's people 3 years ago, hence his lifework of stealing anything Morgane wants. He hands the tablet to Eirine "because it's more use in your bag than in his". Aegnis's bossLines: he had been ordered by Morgane to wait specifically for Eirine.
- **Recruit:** Olivier (turnJoin:4, emerges from village at x:10,y:6)
- **Boss:** 深淵之主惡格尼斯 (Dark Mage lv12, nosferatu+fenrir, sacrifice-ritual bossLines)
- **Key item:** 翠星之鑰 stone tablet → reveals the next destination is 鋼鉄之要塞

---

### Ch8 第八章「鋼鉄之要塞」— The Iron Fortress

- **Map:** Multilevel fortress (20×18), three tiers separated by gates at y=6, y=10, y=14
- **Objective:** Defeat commander Gerhardt (boss kill)
- **Story:** The 翠星之鑰 tablet identifies a sealed chamber in the Iron Fortress. Three general "walls" guard each gate tier. Commander **ゲルハルト (Gerhardt)** is Morgane's true loyalist — Rex warns he has none of Glen's hesitation. Turn 3, his apprentice and 副將 **ヘルガ (Helga)** climbs over the wall — unarmed, single-knee. Turn 5, full recruit: 3 days ago she questioned Gerhardt's order to **burn the 翠星之鑰 mural** beneath the fortress; he whipped her 20 times in front of the troops. She defects not in vengeance but because the Gerhardt who would do that "is not my teacher anymore — Morgane has done something to him". Turn 7, **third Morgane voice scene** — Morgane orders Gerhardt to burn the mural before killing Eirine, betraying that the mural matters more than Eirine's death. Gerhardt's death-line: he **did not burn the mural** — disobeyed Morgane for the first time at the end — and directs the party to the Verdant Star Temple at the snowy peak.
- **Recruit:** Helga (turnJoin:5, defects inside fortress at x:9,y:8)
- **Boss:** 要塞司令官ゲルハルト (Great Knight lv3, silverLance+silverSword, heavy bonusStats, final-loyalty bossLines)

---

### Ch9 第九章「翠星之神殿」— Temple of the Verdant Star

- **Map:** Temple castle (18×20), narrow corridors with multiple gate tiers
- **Objective:** Defeat Zarba (boss kill)
- **Story:** Morgane's cult has occupied the Verdant Star Temple atop a snowy peak. Helga, now fully a party member, identifies the stair markings as identical to the mural pattern beneath Iron Fortress — confirming先王 deliberately hid the temple's location in the place she had spent ten years guarding. Pre-battle, she also reveals **the awakening ritual must complete before 血月之夜 (blood moon night, two days out) or the Star Crest reverses on its holder**. The cult's high priest **祭司長ザルバ (Zarba)** is mid-way through opening the 暗黑之門 (Gate of Darkness) — burning the souls of Helga's converted-undead soldiers as ritual fuel. Helga: "those are my men. Today is the day I let them rest." Mid-chapter, **fourth Morgane voice scene** — Morgane orders Zarba to drag Eirine into the altar so that Star Crest awakening + Gate reversal can take her life at once. Zarba's reflective shield has a 5-second blind moment after every spell verse (Helga's intel) — Lina memorizes the spell-tail "コルガ・モーラ" and shoots through the shield at that beat. Boss kill = ritual collapses. Post: Eirine places the crest into the altar light column; the memories of every prior crest holder stream into her — including her own father; her irises turn faint green. Each of the 10 companions kneels and renews their pledge to her in turn. Then Morgane's sky-face appears: "the crest awakened, I felt it. The palace gate is open — come" — first time Morgane addresses Eirine directly without intermediary. (Note: pre-ch10, Morgane does NOT yet reveal his uncle identity — that is held for ch10 turn 5.)
- **Boss:** 祭司長ザルバ (Dark Mage lv8 on throne, fenrir+nosferatu, sacrifice-and-shield-tell bossLines)
- **Star Crest awakens** at chapter end — Eirine gains the power to counter dark magic and the memory of every prior crest holder

---

### Ch10 最終章「翠星之戰」— Battle of the Verdant Star

- **Map:** Capital city Elfaria (22×18), open plains with flanking forests
- **Objective:** Defeat Morgane (boss kill)
- **Story:** The fully assembled 11-person party returns to a Elfaria emptied of civilians (Morgane drove them into the underground). Turn 1: Marcus walks Eirine past landmarks — Audrey's bakery, the fountain plaza — where Eirine grew up. Turn 2: Morgane's voice from the throne, naming all 11 party members individually; Eirine calls him "莫爾甘叔叔" — a name he has not heard in 30 years — and he registers it. Turn 4: Lina spots a black signal flag at the spire that Morgane is using to mass-control 黑鷹近衛; rides Natasha's pegasus up and shoots it down — her "**mother's revenge**" arrow paying off the ch1 Askar setup. **Turn 5 — the major canon reveal**: Morgane states he is the late king's half-brother, exiled by祖王 over his樂坊女子 mother's "unclean" lineage. The crest responds to him because they share bloodline. He claims he was taking what was always his. Eirine acknowledges the wrong done to him but refuses to absolve the path he chose. Turn 7-8: party approach throne; Morgane sits there with a fake counterfeit Star Crest, says he wanted to test whether Eirine would soften at the last moment "because I am your uncle". She doesn't. Boss kill: Morgane's dark-magic shell breaks; he **reverts to his younger "莫爾甘叔叔" face** — touches her cheek, says he remembers her tiny hand grabbing his finger when she was 3, asks her to apologize to her brother (her father) for him, and to every family he hurt — Eirmela, Glen, Askar, Fran, all the hostages. Then he turns to ash; the ash drifts to the late King's portrait above the throne.
- **Boss:** 莫爾甘 (charId:`morgane`, Dark Mage lv12, starCrest+fenrir, isBoss, heavy bonusStats; uncle-reveal bossLines)
- **Ending:** Eirine acclaimed Queen; refuses Marcus's "陛下"; each companion has a closing line; closing narration names all 11 as "翠星之影" (Shadow of the Verdant Star).

---

## Recurring Threads (cross-chapter through-lines)

For continuity-safety when editing future chapters, do not break these:

| Thread | Chapters | Notes |
|---|---|---|
| **Morgane voice scenes** (星印共鳴) | ch0 / ch4 / ch7 / ch8 / ch9 / ch10 | Morgane addresses the party remotely through magic resonance. Speaker = `morgane`. Each scene escalates: ch4 mocks her father's death, ch7 commands Aegnis to hold the tablet, ch8 orders the mural burned, ch9 plans the altar sacrifice, ch10 reveals the uncle identity. |
| **Hostage doctrine** | ch0 / ch1 / ch5 / ch6 / ch8 / ch10 | Every boss except Aegnis (ch7), Zarba (ch9), and Morgane himself is motivated by family-hostage. The party reads it explicitly by ch5. |
| **Five-kingdoms / crest lore** | ch1 (Lina/Askar) → ch7 (翠星之鑰 tablet) → ch8 (mural) → ch9 (temple + awakening) → ch10 (Lina母親之箭 payoff) | Tracks the Verdant Star location reveal through three artifacts: tablet → mural → altar. |
| **Marcus's sister Elena (艾蓮娜)** | ch6 reveal | Married into Eirmela 30 years ago, died in the ch6-3-day-prior massacre. Natasha knew her. Closes Marcus's family arc; sets up his ch10 throne-room "task half complete" line. |
| **Glen's family (艾莉莎 / 伊凡 / 蕾娜)** | ch5 promise → never literally revisited but Eirine's "I will remember" remains a structural pillar | Do not rename. Do not have Eirine forget. |
| **Rex–Glen master-student bond** | ch5 | Rex delivers Glen's killing blow himself; quotes "騎士的劍，是為了不能拿劍的人而舉" — Rex's defining line. |
| **Helga–Gerhardt master-student rupture** | ch8 recruit + ch8 boss | Mirror of Rex–Glen but inverted: Helga defects FROM her master because Morgane corrupted him. Gerhardt's dying line restores their bond by disobeying Morgane's mural order. |
| **Cain–Zeno court history** | ch3 mid-chapter → ch4 boss | Cain knows Zeno from royal court days; this is what makes Cain the party's "former insider". |
| **Fran's stolen research** | ch4 (escape) → ch9 (uses construction notes to identify暗黑之門 ritual) → ch10 (vows to burn the rest after victory) | Fran's arc: weaponizes her captor's research, then renounces it. |
| **Serra's prayers for the enemy dead** | ch2 / ch4 / ch8 / ch9 | Serra explicitly grieves for fallen enemies; in ch9 she recites a 往生咒 for Helga's converted-undead soldiers. Don't write her as a generic "white-mage". |
| **Olivier's "回收 (recovery)" running gag** | ch7 onward | Light comic relief about loot priority; counterweight to the heavier moral threads. Cain plays straight man. |

---

## Speaker conventions

- For characters in `CHARACTERS` (chapters.js), use the `charId` as speaker string — `dialogue.js` will render portrait + name.
- For named NPCs/bosses without a CHARACTERS entry (Glen, Zarba, Gerhardt's-era figures), use the **Chinese / katakana name string** directly as speaker — `dialogue.js` falls through to literal-string display with a placeholder portrait. Examples: `"格倫"`, `"ザルバ"`.
- For ambient narration use `speaker: null`.
- Inline `dialogues` field inside `config.json` is **dead code**. The loader (`chapters.js:loadChapter`) spreads `{...config, dialogues, prologue}` so an external `dialogues.json` always overrides inline content. Edit `dialogues.json` directly.

---

## Story Arc

```
Coup & Escape (ch0) — establish hostage doctrine, the uncle thread (hidden)
  → Gathering allies in the wilderness (ch1–ch3) — Askar lore + court refugees
  → Uncovering the Star Crest mystery (ch4–ch5) — Morgane voice begins; first hostage-tragedy boss
  → Cutting imperial supply lines (ch6) — Marcus's sister revealed dead
  → Recovering the 翠星之鑰 tablet (ch7) — Olivier joins; Morgane voice escalates
  → Breaking the Iron Fortress, finding the mural (ch8) — Helga defects from her master; mural points to temple
  → Awakening the Star Crest (ch9) — every prior holder's memory; companions kneel; Morgane sky-challenge
  → Final battle (ch10) — uncle revealed; party brings 30 years of hostage-debt to the throne
```

The title 翠星之影 ("Shadow of the Verdant Star") refers to:
1. The shadow cast over the kingdom by Morgane.
2. The guiding light that leads Eirine home.
3. In light of the ch10 reveal, also the shadow-side of her own bloodline that she had to defeat to claim it.

# Story & World

## World

**Continent:** 艾爾德拉（Eldra）

A thousand years ago five stars fell and became five **Star Crests** (星印), each granting elemental power to its bearer. The five kingdoms each held one crest and kept a thousand-year peace.

A sixth star — the **Verdant Star** (翠星) — hid in a crack in the world. When imperial chancellor **Morgane** (莫爾甘) discovered its existence, he staged a coup, aiming to gather all six crests and ascend to godhood.

The story follows Princess **Eirine** (艾琳) of the Elfaria Kingdom (艾爾法利亞王國), who is forced to flee the palace on the night of the coup and begins a resistance campaign to reclaim her kingdom.

---

## Playable Characters

| charId | Name | Class | Joins | Notes |
|---|---|---|---|---|
| `eirine` | 艾琳 | Lord | ch0 | Protagonist. Carries the Star Crest. Isλord = true. |
| `marcus` | 馬庫斯 | Paladin | ch0 | Veteran knight, Jagen-type (strong early, low growths). |
| `lina` | 莉娜 | Archer | ch1 | Forest hunter. High SPD/SKL, low DEF. |
| `thor` | 托爾 | Fighter | ch2 | Northern warrior. High HP/STR, low SPD. |
| `serra` | 賽拉 | Cleric | ch2 | Church healer. High MAG/RES, low DEF. |
| `cain` | 凱恩 | Mercenary | ch3 | Lone swordsman, balanced growths. |
| `fran` | 法蘭 | Mage | ch4 | Genius mage. Extremely high MAG, very low DEF. |
| `rex` | 雷克斯 | Wyvern Rider | ch5 | Defected imperial dragon knight. High STR/DEF, low RES. |
| `natasha` | ナターシャ | Pegasus Knight | ch6 | Sky knight from a conquered free city. High SPD/RES. |
| `olivier` | オリヴィエ | Thief | ch7 | Self-described "recovery specialist". Very high SPD. |
| `helga` | ヘルガ | General | ch8 | Defected imperial general. Very high DEF. |

Non-playable important characters: `morgane` (final boss, has portrait at `portraits/morgane.png`), `king` (Eirine's father, ch0 prologue), `guardCaptain` (ch0 antagonist).

---

## Chapter Summaries

### Ch0 序章「墜落之夜」— Fallen Night

- **Map:** Royal palace corridors
- **Objective:** Eirine reaches the exit (seize)
- **Story:** Morgane's coup. The King presses the Star Crest into Eirine's hands and sacrifices himself to let her escape. Marcus escorts her out through a secret passage.
- **Recruit:** Eirine, Marcus

---

### Ch1 第一章「荒野的邂逅」— Wilderness Encounter

- **Map:** Forest and plains (荒野)
- **Objective:** Rout all empire pursuers
- **Story:** Fleeing north at dawn, Eirine and Marcus encounter imperial pursuit squads blocking the road. A forest hunter named Lina shoots down a scout and offers to help.
- **Recruit:** Lina (joins pre-battle)

---

### Ch2 第二章「北境之村」— Northern Village

- **Map:** Village under attack
- **Objective:** Seize the command post
- **Story:** Arriving at a northern village to seek supplies, the party finds it under attack by an imperial centurion. A local fighter named Thor is holding the gate; healer Serra is treating his wounds. Together they retake the village.
- **Recruit:** Thor, Serra (join pre-battle)

---

### Ch3 第三章「傭兵的試煉」— Mercenary's Trial

- **Map:** Ruined castle (布倫古城)
- **Objective:** Rout all imperial pursuers
- **Story:** The party finds a ruined castle occupied by mercenaries who refused imperial hire. The empire sends a retaliatory force. Eirine's group helps defend, earning Cain's grudging trust.
- **Recruit:** Cain (turnJoin:1, speaks with Eirine on turn 1)
- **Boss:** 追討騎士長 (Cavalier lv8)

---

### Ch4 第四章「魔法塔」— The Magic Tower

- **Map:** Tall tower interior (14×18), 4 tiers
- **Objective:** Eirine reaches the tower top (seize at x:6,y:0)
- **Story:** The party infiltrates a fog-shrouded ancient tower where Fran, a young genius mage, has been imprisoned by imperial mages and forced to research the Star Crest. Eirine fights upward through four tiers to rescue her. Boss: Chief Mage 澤諾 (dark mage, nosferatu+flux).
- **Recruit:** Fran (turnJoin:1, appears at tower top)
- **Boss:** 首席魔導師澤諾 (Dark Mage lv1, bonusStats heavy)

---

### Ch5 第五章「星辰要塞」— Fortress of Stars

- **Map:** River crossing fortress (20×14)
- **Objective:** Seize the fortress
- **Story:** The Starfire Fortress (星辰要塞) blocks the only river crossing northward. Its legendary commander 格倫 ("Empire's Shield") has never been breached. Rex, a defected imperial wyvern knight, joins as reinforcements.
- **Recruit:** Rex (joins mid-chapter)
- **Boss:** 格倫 (fortress commander)

---

### Ch6 第六章「裏切之港」— Port of Betrayal

- **Map:** Coastal port (18×16)
- **Objective:** Seize the port command post
- **Story:** The party heads south to cut the empire's sea supply lines at a major coastal port controlled by Admiral Balsar (提督巴爾薩). Sea pirates complicate the assault. A pegasus knight named Natasha drops in from the sky on turn 3 with news of a destroyed free city.
- **Recruit:** Natasha (turnJoin:3)
- **Boss:** 提督巴爾薩 (Archer, killerBow, isBoss)

---

### Ch7 第七章「深淵之森」— Forest of the Abyss

- **Map:** Ancient dark forest (20×16)
- **Objective:** Rout all enemies
- **Story:** The party enters the 深淵之森, a forest thick with dark magic where brigands and dark mages serve an entity called the Lord of the Abyss. The empire sent agents to find an ancient rune tablet linked to the Star Crest. Olivier, a thief ("recovery specialist"), retrieves the tablet and joins the party.
- **Recruit:** Olivier (turnJoin:2, emerges from village at x:10,y:6)
- **Boss:** 深淵之主惡格尼斯 (Dark Mage lv12, nosferatu+fenrir, isBoss)
- **Key item:** Ancient rune tablet retrieved by Olivier — points the party toward the 鋼鉄之要塞

---

### Ch8 第八章「鋼鉄之要塞」— The Iron Fortress

- **Map:** Multilevel fortress (20×18), three tiers separated by gates at y=6, y=10, y=14
- **Objective:** Defeat commander Gerhardt (boss kill)
- **Story:** The rune tablet reveals a sealed chamber in the Iron Fortress. Three general "walls" guard each gate tier. Deep inside, Helga — commander of the 3rd Heavy Armour Division — defects after seeing the party break through what she thought was impenetrable. The boss, Gerhardt (鐵甲將軍ゲルハルト), falls and his final words direct the party to a hidden mural showing the Verdant Star Temple's location.
- **Recruit:** Helga (turnJoin:5, defects inside fortress at x:9,y:8)
- **Boss:** 要塞司令官ゲルハルト (Great Knight lv3, silverLance+silverSword, heavy bonusStats)

---

### Ch9 第九章「翠星之神殿」— Temple of the Verdant Star

- **Map:** Temple castle (18×20), narrow corridors with multiple gate tiers
- **Objective:** Defeat Zarba (boss kill)
- **Story:** Morgane's cult has occupied the Verdant Star Temple atop a snowy peak and is performing a dark ritual to open a Gate of Darkness. Helga, the defected imperial general, was already inside trying to stop it alone — her soldiers were turned into undead. The party enters and defeats high priest Zarba. The Star Crest awakens on the altar.
- **Boss:** 祭司長ザルバ (Dark Mage lv8 on throne, fenrir+nosferatu, heavy bonusStats)
- **Star Crest awakens** at chapter end — Eirine gains the power to counter dark magic

---

### Ch10 最終章「翠星之戰」— Battle of the Verdant Star

- **Map:** Capital city Elfaria (22×18), open plains with flanking forests
- **Objective:** Defeat Morgane (boss kill)
- **Story:** The fully assembled party returns to the capital. Every character has their final speech before the assault. Morgane, empowered by dark magic, waits on the palace gate (G tile at x:10,y:0) with paladins, generals, sages, swordmasters, and dark mages layered in depth. Eirine defeats him with the awakened Star Crest. The game ends with each character's epilogue line.
- **Boss:** 莫爾甘 (charId:`morgane`, Dark Mage lv12, starCrest+fenrir, isBoss, very heavy bonusStats)
- **Ending:** Morgane's body dissolves; Eirine is acclaimed Queen; each companion has a closing line.

---

## Story Arc

```
Coup & Escape (ch0)
  → Gathering allies in the wilderness (ch1–ch3)
  → Uncovering the Star Crest mystery (ch4–ch5)
  → Cutting imperial supply lines (ch6)
  → Recovering the rune tablet from the abyss (ch7)
  → Breaking the Iron Fortress, finding the temple (ch8)
  → Awakening the Star Crest (ch9)
  → Final battle and liberation of the capital (ch10)
```

The title 翠星之影 ("Shadow of the Verdant Star") refers to both the shadow cast over the kingdom by Morgane and the guiding light that leads Eirine home.

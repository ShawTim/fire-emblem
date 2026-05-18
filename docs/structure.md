# Project Structure

## Running

```
npm start
```

Launches `http-server -c-1 -o`. **Required** — all chapter data is loaded via `fetch()`, so opening `index.html` directly over `file://` silently breaks everything (chapters fall back to a blank 10×10 map with subtitle 載入失敗).

---

## Entry Point

`index.html` — loads all JS files as plain `<script>` tags (no bundler). Order matters; `data/` files must load before the files that use them.

---

## JavaScript Modules

### Core game loop

| File | Responsibility |
|---|---|
| `js/main.js` | Initialisation, `requestAnimationFrame` loop, input routing |
| `js/game.js` | Game-state machine: chapter loading, turn phases, unit spawning, `generateEnemyStats()`, `processTurnEvents()` |
| `js/map.js` | Terrain and tile rendering, `parseTerrain()` (splits object codes into two layers) |
| `js/unit.js` | `Unit` class, stat formulas, `TERRAIN_DATA`, `OBJECT_DATA`, `getAtk/Hit/Crit/Avo/Def` |
| `js/combat.js` | Damage / hit / crit calculation, nosferatu drain mechanic (combat.js:106-107) |
| `js/ai.js` | Enemy turn orchestration: target selection, movement, attack decisions |
| `js/game/ai-turn.js` | Executes a single enemy unit's turn (called by ai.js) |

### Rendering

| File | Responsibility |
|---|---|
| `js/sprites.js` | Procedural pixel-art sprites, PNG loading/cache, `drawUnit()`, `_frameCounter` animation tick |
| `js/unit-layer.js` | Draws all units on the map canvas each frame |
| `js/battle.js` | Battle forecast UI and animation |

### UI

| File | Responsibility |
|---|---|
| `js/ui.js` | Top bar, info panel, action menus, `updateTopBar()` |
| `js/dialogue.js` | Dialogue box with portrait, sequence playback |
| `js/cursor.js` | Map cursor movement and highlight |
| `js/game/minimap.js` | Minimap overlay |
| `js/game/prologue.js` | Prologue cinematic text player |

### Systems

| File | Responsibility |
|---|---|
| `js/game/save.js` | `localStorage` save / load |
| `js/bgm.js` / `js/bgm-tracks.js` | Web Audio API music (oscillator synthesis, no audio files) |
| `js/sfx.js` | Sound effects |
| `js/mobile.js` | Touch-input handling |
| `js/config.js` | Global constants |

### Data layer (`js/data/`)

| File | Responsibility |
|---|---|
| `chapters.js` | `CHARACTERS` dict (all playable characters with baseStats/growths), async `preloadChapters()`, `CHAPTERS[]` Proxy (returns `null` before preload — never access synchronously) |
| `classes.js` | `CLASSES` dict — 30+ class definitions with weapon lists, stat caps, promotion paths, sprite filenames |
| `items.js` | Item definitions, `createItem()` factory |

---

## Map Data (`maps/`)

Each chapter lives in `maps/ch{N}_{name}/`:

| File | Content |
|---|---|
| `terrain.txt` | One character per tile, one row per line. See [AGENTS.md](../AGENTS.md) for the full terrain-code table. |
| `config.json` | Map dimensions, `playerUnits`, `enemies`, `newRecruits`, objective type/position, optional `terrainRandomize`, `turnEvents` |
| `dialogues.json` | `pre` and `post` battle dialogue arrays (`speaker` + `text` objects) |
| `prologue.json` | Pre-chapter cinematic lines (optional; some chapters omit it) |

Chapter list:

| Dir | Title | Subtitle |
|---|---|---|
| `ch0_prologue` | 序章 | 墜落之夜 |
| `ch1_wilderness` | 第一章 | 荒野的邂逅 |
| `ch2_village` | 第二章 | 北境之村 |
| `ch3_castle` | 第三章 | 傭兵的試煉 |
| `ch4_church` | 第四章 | 魔法塔 |
| `ch5_river` | 第五章 | 星辰要塞 |
| `ch6_forest` | 第六章 | 裏切之港 |
| `ch7_desert` | 第七章 | 深淵之森 |
| `ch8_mountain` | 第八章 | 鋼鉄之要塞 |
| `ch9_castle` | 第九章 | 翠星之神殿 |
| `ch10_final` | 最終章 | 翠星之戰 |

---

## Assets

| Path | Contents |
|---|---|
| `portraits/` | AI-generated PNG portraits (one per `charId`). If a file is missing, `sprites.js` draws a procedural fallback — so adding a character without a portrait is safe. |
| `assets/sprites/` | Sprite sheet images |
| `css/style.css` | All UI styles |

---

## Other Files

| Path | Notes |
|---|---|
| `characters/index.html` | Character viewer (standalone page) |
| `classes/index.html` | Class reference viewer |
| `demo/index.html` | Demo page |
| `scripts/` | One-off Python / shell generation scripts. Not part of the game runtime. |
| `gen_chapters.py` | **Orphaned.** Generates the old hardcoded-array format that was replaced by the file-based loader. Do not run. |
| `analyze_classes.js` / `update_sprites.js` | One-off utility scripts, not loaded by the game |
| `DESIGN.md` | Original game design document (written before implementation; some details diverge from actual code) |
| `WORK_SUMMARY.md` | Sprint summary of sprite/animation work (Cantonese) |

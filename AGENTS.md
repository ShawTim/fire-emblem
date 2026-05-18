# AGENTS.md

## Read these first

Before working on this project, read the docs in [`docs/`](docs/):

| Doc | When to read |
|---|---|
| [`docs/structure.md`](docs/structure.md) | Before touching any JS file — maps every module and data file |
| [`docs/story.md`](docs/story.md) | Before editing dialogue, enemy placement, or chapter config — has the full narrative and character roster |
| [`docs/status.md`](docs/status.md) | Before adding/changing enemies — has per-chapter enemy counts, boss stats, and known issues |

The sections below contain **non-obvious gotchas** not derivable from reading the code.

---

## Running the game

`npm start` — required. Chapter data is loaded via `fetch()`; opening `index.html` directly over `file://` silently fails (all chapters fall back to a blank 10×10 map with subtitle 載入失敗).

No test suite. `npm test` exits with error. Verification is visual: load in browser, navigate to the chapter you changed.

## Where chapter content lives

`js/data/chapters.js` contains character definitions and an async loader only. All per-chapter data is fetched at runtime from files under `maps/`:

| File | Content |
|---|---|
| `maps/ch{N}_{name}/terrain.txt` | Terrain map — one character per tile, one row per line |
| `maps/ch{N}_{name}/config.json` | Dimensions, unit placements, objectives, optional `terrainRandomize` |
| `maps/ch{N}_{name}/dialogues.json` | Pre/post-battle dialogue sequences |
| `maps/ch{N}_{name}/prologue.json` | Pre-chapter cinematic dialogue (optional) |

Editing inline terrain or dialogue inside `chapters.js` has no effect.

`gen_chapters.py` — orphaned. It generates the old hardcoded-array format that was replaced by the file-based loader. Do not run it.

## Terrain codes

`TERRAIN_CODES` in `js/data/chapters.js:37` is the authoritative list. The terrain codes in `CLAUDE.md` are incomplete; the full set:

| Code | Terrain | Code | Terrain |
|---|---|---|---|
| `P` / `.` / ` ` | plain | `H` | hill |
| `F` | forest | `S` | swamp |
| `M` | mountain | `C` | cliff |
| `W` | wall | `N` | pass |
| `G` | gate | `D` | road |
| `R` | river | `A` | basin |
| `V` | village | `E` | sea |
| `T` | throne | `K` | desert |
| `L` | pillar | `X` | bridge |
| `I` | floor | `U` | ruins |
| `O` / `+` | fort | `Z` | stairs |
| `B` | brazier | | |

An unrecognised code silently becomes `plain` with no warning.

## Object codes produce two map layers

Codes `V G T L O + B Z U` (village, gate, throne, pillar, fort, brazier, stairs, ruins) write to **both** `terrain[][]` and `objects[][]`. The base terrain stored in `terrain[][]` is `plain` or `floor` — never the object name itself. Search `objects[][]` when looking for tile overlays; `terrain[][]` will not contain `'village'`, `'throne'`, etc.

## CHAPTERS[] Proxy: null before preload

`CHAPTERS[n]` (the compatibility Proxy in `chapters.js:203`) returns `null` — no exception — when accessed before `preloadChapters()` resolves. New synchronous code that reads `CHAPTERS[n]` will silently receive null downstream.

## terrainRandomize — non-deterministic maps

Chapters with a `terrainRandomize` key in `config.json` convert a random fraction of plain tiles to forest or hill on every load. Tile layout is **not stable** between reloads on those chapters. Unit spawn positions are excluded (controlled by `safeRadius`). Chapters without this key have fixed terrain.

## Portrait images

`portraits/` contains real PNG files that take priority over canvas-drawn fallbacks. `ui.js` attempts to load `portraits/{charId}.png`; if the image loads, it is displayed; if not, `sprites.js` draws a procedural portrait on canvas. Adding a character without a corresponding PNG is valid — the canvas fallback activates automatically.

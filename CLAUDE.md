# CLAUDE.md

## Project
火炎之紋章：翠星之影 — Web-based tactical RPG (SRPG) inspired by Fire Emblem GBA series. Entirely vibe coded with AI assistance.

## Tech Constraints
- **Zero dependencies** — pure HTML5 Canvas + vanilla JS
- **Zero image assets** — all sprites procedurally generated (Canvas API)
- **All text in Traditional Chinese** (正體中文)
- Single `index.html` entry point, all JS in `js/` folder

## Architecture
```
js/main.js       → Game loop, input (mouse + touch + keyboard)
js/game.js       → State machine, turn logic, unit commands, menus
js/battle.js     → GBA-style battle animation scenes (64px sprites)
js/combat.js     → Damage calc, weapon triangle, EXP, healing
js/ai.js         → Enemy AI (aggressive/defensive/boss)
js/map.js        → Grid, terrain, BFS pathfinding
js/unit.js       → Unit class, stats, growth rates, level-up
js/sprites.js    → Procedural pixel art (terrain, units, portraits)
js/ui.js         → DOM overlays, status screen, menus, forecast
js/dialogue.js   → Typewriter dialogue system
js/cursor.js     → Grid cursor movement
js/data/chapters.js → 11 chapters, terrain maps, characters, enemies, dialogues
js/data/classes.js  → Class definitions, promotion paths
js/data/items.js    → Weapons, staves, items
```

## Game Mechanics
- **Weapon Triangle**: Sword > Axe > Lance > Sword (±15 hit, ±1 atk)
- **Terrain**: Forest (+1 def, +20 avo), Mountain (+2 def, +30 avo), etc.
- **Double Attack**: Speed difference ≥ 5
- **Growth Rates**: 70% = 70% chance +1; 130% = guaranteed +1 + 30% chance +2
- **EXP**: Promoted units use effective level +20 (Jagen archetype gets minimal EXP)

## Content
- 11 chapters (Prologue → Final Boss)
- 11 playable characters
- 228 enemies across all maps
- Maps up to 22×18 tiles

## Rules
- Mobile-friendly (touch + responsive CSS)
- Terrain maps use string format: W=wall, P=plain, F=forest, M=mountain, G=gate, R=river, V=village, T=throne, L=pillar
- Unit stats follow FE conventions (HP/STR/MAG/SKL/SPD/LCK/DEF/RES)
- Keep growth rates hidden from player (authentic FE feel)
- Dialogue in character — each character has distinct personality

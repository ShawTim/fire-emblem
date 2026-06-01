// Redesign ch0 序章 墜落之夜 — tutorial palace escape (20x13, modest bump, seize the door).
// Eirine + Marcus flee top-left through palace halls to the secret door (bottom centre),
// fighting escalating imperial soldiers (weak near the start by design). Tight tutorial
// pacing; turnEvents/dialogue/bossLines preserved, positions remapped by index.
const L = require('./genlib');
const DIR = 'ch0_prologue';
const W = 20, H = 13;
const g = L.makeGrid(W, H, 'W');
const S = (x, y, c) => L.set(g, x, y, c);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[1, 1], [2, 1]];                 // eirine, marcus (top-left)
const SEIZE = [10, 12];                            // secret door (bottom)
const ENEMIES = [
  [5, 2], [7, 2],     // 0,1 soldiers L1 (first fight, weak)
  [16, 3],            // 2 soldier L2
  [15, 6],            // 3 soldier L2 (def)
  [9, 6],             // 4 soldier L3 (sergeant)
  [4, 8], [11, 8], [15, 9],   // 5 soldier, 6 archer, 7 soldier (L3)
  [9, 11],            // 8 knight (door guard)
  [10, 12],           // 9 boss 守衛隊長 (on the door)
];

// ---- terrain (palace interior) -------------------------------------------
L.rect(g, 1, 1, 18, 11, 'I', true);
// pillar colonnades (palace hall)
[2, 7, 10].forEach(y => { for (let x = 3; x <= 16; x += 3) if (g[y][x] === 'I') S(x, y, 'L'); });
// mid wall divider with side openings (navigate around it)
L.hline(g, 4, 15, 4, 'W');
// secret door in the bottom wall + flanking braziers (night palace)
S(SEIZE[0], SEIZE[1], 'T');
S(4, 1, 'B'); S(15, 1, 'B');

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
if (ENEMIES.length !== cfg.enemies.length) throw new Error(`ENEMIES ${ENEMIES.length} != cfg ${cfg.enemies.length}`);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
cfg.seizePos = { x: SEIZE[0], y: SEIZE[1] };
console.log('config  ->', L.writeConfig(DIR, cfg));

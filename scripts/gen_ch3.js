// Redesign ch3 城堡 傭兵的試煉 — a moated keep + exterior approach (20x16, rout).
// Castle is deliberate architecture (walls/gate/bridge/throne/pillars); the
// exterior keeps organic forest/hill cover. Cain spawns isolated east; Marcus rushes.
const L = require('./genlib');
const DIR = 'ch3_castle';
const W = 20, H = 16;
const rng = L.mulberry32(0x3CA571E);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[1, 14], [0, 14], [2, 15], [1, 15], [0, 15]]; // eirine, marcus, lina, thor, serra
const CAIN = [17, 10];                                          // recruit, isolated east
const ENEMIES = [
  [7, 2],   // 0 soldier  steelLance aggr  (in keep)
  [13, 2],  // 1 archer   steelBow   def    (keep NE vantage)
  [11, 3],  // 2 fighter  steelAxe   aggr
  [13, 4],  // 3 archer   steelBow   def
  [8, 5],   // 4 knight   steelLance def    (gate guard)
  [10, 3],  // 5 soldier  steelLance aggr
  [12, 4],  // 6 fighter  steelAxe   aggr
  [11, 5],  // 7 knight   steelLance def    (gate guard)
  [6, 4],   // 8 soldier  steelLance aggr
  [15, 9],  // 9 archer   steelBow   def    (east, near Cain)
  [18, 9],  // 10 soldier steelLance aggr   (east, near Cain)
  [15, 11], // 11 knight  steelLance def    (east, near Cain)
  [9, 3],   // 12 boss cavalier (central hall)
];
const REINFORCE = { 4: [[19, 11], [19, 12]] };                 // east edge

// ---- terrain --------------------------------------------------------------
const g = L.makeGrid(W, H, 'P');

// exterior organic cover (approach + flanks), kept clear of the start corner
L.blob(g, 2, 10, 2, 'F', 0.6, rng);
L.blob(g, 5, 12, 2, 'F', 0.55, rng);
L.blob(g, 8, 14, 2, 'F', 0.5, rng);
L.blob(g, 18, 6, 2, 'F', 0.6, rng);
L.blob(g, 16, 14, 2, 'F', 0.5, rng);
L.blob(g, 1, 7, 2, 'H', 0.5, rng);
L.blob(g, 12, 14, 2, 'H', 0.5, rng);
// Lina's east vantage hills (T4 dialogue)
[[13, 11], [14, 11], [13, 12], [12, 11]].forEach(([x, y]) => L.set(g, x, y, 'H'));
// forts for cover on the approach
L.set(g, 3, 12, 'O'); L.set(g, 16, 13, 'O');

// castle keep: outer wall outline, floor interior
L.rect(g, 4, 0, 15, 6, 'W', false);
L.rect(g, 5, 1, 14, 5, 'I', true);
// gatehouse (double gate) on the south wall + bridge over the moat
L.set(g, 9, 6, 'G'); L.set(g, 10, 6, 'G');
L.hline(g, 4, 15, 7, 'R');            // moat hugging the south face
L.set(g, 9, 7, 'X'); L.set(g, 10, 7, 'X');
// throne hall: throne + flanking braziers + pillars
L.set(g, 10, 1, 'T'); L.set(g, 6, 1, 'B'); L.set(g, 13, 1, 'B');
[[7, 3], [12, 3], [7, 4], [12, 4]].forEach(([x, y]) => { if (g[y][x] === 'I') L.set(g, x, y, 'L'); });
// corner towers (mountain shoulders outside the wall corners)
L.set(g, 3, 0, 'M'); L.set(g, 16, 0, 'M');

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  { x: CAIN[0], y: CAIN[1], ch: '&' },
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
cfg.newRecruits[0].x = CAIN[0]; cfg.newRecruits[0].y = CAIN[1];
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

// Redesign ch4 魔法塔 — a taller tower interior (16x24, seize the top).
// Stacked floors joined by a winding chokepoint climb, a mid-tower magic-circle
// chamber (the summoning floor), stairs/braziers/pillars. Boss + Fran at summit.
const L = require('./genlib');
const DIR = 'ch4_church';
const W = 16, H = 24;

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[8, 22], [7, 21], [9, 21], [8, 21], [7, 22], [9, 22]]; // eirine,marcus,lina,thor,serra,cain
const FRAN = [2, 1];                                                     // recruit at summit
const SEIZE = [8, 0];
const ENEMIES = [
  [3, 17], [12, 17],            // 0,1 soldiers (lower floor)
  [8, 13], [3, 13], [12, 13],   // 2 mage(fire) center, 3,4 knights (magic-circle floor)
  [3, 9], [12, 9], [5, 9], [10, 9],   // 5,6 mages aggr, 7,8 knights (floor B)
  [3, 5], [12, 5], [5, 5], [10, 5],   // 9,10 mages, 11,12 dark mages (floor A)
  [3, 2], [12, 2], [5, 2], [10, 2],   // 13,14 soldiers, 15,16 dark mages (boss chamber)
  [8, 2],                       // 17 boss 澤諾
];
const REINFORCE = { 3: [[4, 12], [11, 12]] };   // skeletons on the magic-circle floor

// ---- terrain --------------------------------------------------------------
const g = L.makeGrid(W, H, 'W');
L.rect(g, 1, 1, 14, 22, 'I', true);            // hollow interior
L.set(g, SEIZE[0], SEIZE[1], 'G');             // top: seize gate
L.set(g, 8, 23, 'G');                          // bottom: entrance gate

// floor dividers with a 2-wide stair passage, zigzagging up the tower
function divider(y, gx) { L.hline(g, 1, 14, y, 'W'); L.set(g, gx, y, 'Z'); L.set(g, gx + 1, y, 'I'); }
divider(19, 2);    // left
divider(15, 11);   // right
divider(11, 7);    // centre
divider(7, 2);     // left
divider(4, 11);    // right

// mid-tower magic circle (braziers ring around the summon point)
[[6, 12], [9, 12], [6, 14], [9, 14]].forEach(([x, y]) => L.set(g, x, y, 'B'));
// boss-chamber ambiance: braziers flanking the seize gate, pillars in the halls
L.set(g, 6, 1, 'B'); L.set(g, 10, 1, 'B');
[[7, 6], [8, 6], [4, 10], [11, 10], [7, 17], [8, 17]].forEach(([x, y]) => { if (g[y][x] === 'I') L.set(g, x, y, 'L'); });

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  { x: FRAN[0], y: FRAN[1], ch: '&' },
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
cfg.newRecruits[0].x = FRAN[0]; cfg.newRecruits[0].y = FRAN[1];
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
cfg.seizePos = { x: SEIZE[0], y: SEIZE[1] };
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

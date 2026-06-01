// Redesign ch7 深淵之森 — a dense dark forest (24x18, rout).
// Heavy forest with carved glades + a winding road, swamp "abyssal mist" pools,
// an ancient ruins altar (boss Agnis) up top, a central hut (Olivier emerges T4).
// Roster/turnEvents/dialogue preserved, positions remapped by index.
const L = require('./genlib');
const DIR = 'ch7_desert';
const W = 24, H = 18;
const rng = L.mulberry32(0x7DA12C7);
const g = L.makeGrid(W, H, 'P');
const S = (x, y, c) => L.set(g, x, y, c);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[2, 15], [1, 15], [3, 15], [2, 16], [1, 16], [3, 16], [4, 15], [4, 16], [5, 15]]; // eirine,marcus,lina,thor,serra,cain,fran,rex,natasha
const OLIVIER = [12, 8];                                // recruit T4 (central hut)
const ENEMIES = [
  [4, 1], [20, 1], [8, 2], [14, 2], [6, 4], [16, 3],   // 0-5
  [2, 5], [12, 4], [21, 6], [6, 7], [17, 6], [9, 8],   // 6-11
  [21, 9], [5, 8], [13, 9], [10, 10], [17, 10], [19, 11], // 12-17
  [8, 11], [12, 13], [15, 12], [10, 12],               // 18-21 (def, kept off the SW glade)
  [11, 2],                                             // 22 boss Agnis (altar)
];
const REINFORCE = {
  3: [[0, 0], [23, 2]],
  5: [[23, 9], [23, 7], [11, 14], [12, 14]],
};

// ---- terrain --------------------------------------------------------------
// dense forest base
L.sprinkle(g, 'F', 0.55, rng, () => false);
// carved glades (clearings)
L.rect(g, 0, 13, 6, 17, 'P', true);     // SW party glade
L.rect(g, 9, 6, 15, 10, 'P', true);     // central hut glade
L.rect(g, 7, 0, 16, 4, 'P', true);      // altar glade (top)
// winding road centre -> altar (kept north of the party glade so forest buffers the start)
L.vline(g, 3, 6, 10, 'D'); L.hline(g, 3, 11, 8, 'D'); L.vline(g, 11, 4, 8, 'D'); L.hline(g, 8, 11, 4, 'D');
// abyssal-mist swamp pools
L.blob(g, 6, 10, 2, 'S', 0.7, rng); L.blob(g, 19, 13, 2, 'S', 0.6, rng); L.blob(g, 18, 4, 1, 'S', 0.8, rng);
// ancient altar (ruins) + central hut
[[10, 2], [12, 2], [11, 1], [11, 3], [10, 1], [12, 1]].forEach(([x, y]) => S(x, y, 'U'));
S(OLIVIER[0], OLIVIER[1], 'V');
// cliff boundary accents at the corners (impassable, decorative)
[[0, 0], [1, 0], [0, 1], [23, 0], [22, 0], [23, 1], [0, 17], [23, 17]].forEach(([x, y]) => S(x, y, 'C'));

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  { x: OLIVIER[0], y: OLIVIER[1], ch: '&' },
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
cfg.newRecruits[0].x = OLIVIER[0]; cfg.newRecruits[0].y = OLIVIER[1];
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

// Redesign ch5 星辰要塞 — riverbank fortress assault (22x20, boss=Glen).
// North bank -> river (center drawbridge = sole crossing) -> gatehouse -> stone
// courtyard with archer towers -> back throne keep. Flanks open for the T4 pincer;
// Rex flies in T2. Roster/turnEvents/dialogue preserved, positions remapped by index.
const L = require('./genlib');
const DIR = 'ch5_river';
const W = 22, H = 20;
const rng = L.mulberry32(0x5814F03);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[10, 1], [9, 1], [11, 1], [10, 0], [9, 0], [11, 0], [8, 1]]; // eirine,marcus,lina,thor,serra,cain,fran
const REX = [18, 3];                                  // recruit (flying) T2, NE bank
const ENEMIES = [
  [8, 8], [13, 8],     // 0,1 soldiers (inner gate guards)
  [6, 10], [15, 10],   // 2,3 knights
  [3, 9], [18, 9],     // 4,5 archers (on the corner towers)
  [8, 12], [13, 12],   // 6,7 mages
  [6, 11], [15, 11],   // 8,9 soldiers (aggressive)
  [9, 15], [12, 15],   // 10,11 knights (keep approach)
  [9, 7], [12, 7],     // 12,13 fighters (aggressive gate harassers)
  [10, 13],            // 14 archer (keep approach)
  [10, 17],            // 15 boss Glen (throne)
  [11, 17],            // 16 soldier (boss guard)
];
const REINFORCE = {
  4: [[0, 8], [21, 8], [0, 10], [21, 10], [1, 12], [20, 12]],   // flank pincer
  7: [[9, 18], [12, 18], [10, 18]],                             // keep last guard
};

// ---- terrain --------------------------------------------------------------
const g = L.makeGrid(W, H, 'P');
// north bank organic cover
L.blob(g, 2, 1, 2, 'F', 0.6, rng); L.blob(g, W - 3, 1, 2, 'F', 0.6, rng);
L.blob(g, 5, 2, 2, 'H', 0.5, rng); L.blob(g, 16, 2, 2, 'H', 0.5, rng);
// river with central drawbridge
L.rect(g, 0, 4, W - 1, 5, 'R', true);
[[10, 4], [11, 4], [10, 5], [11, 5]].forEach(([x, y]) => L.set(g, x, y, 'X'));
// fortress courtyard (stone floor)
L.rect(g, 3, 6, 18, 18, 'I', true);
// gatehouse framing the bridge landing
L.set(g, 9, 6, 'W'); L.set(g, 12, 6, 'W'); L.set(g, 10, 6, 'G'); L.set(g, 11, 6, 'G');
// corner archer towers
[[3, 9], [18, 9], [3, 15], [18, 15]].forEach(([x, y]) => L.set(g, x, y, 'O'));
// back throne keep
L.rect(g, 8, 16, 13, 19, 'W', false);
L.rect(g, 9, 17, 12, 18, 'I', true);
L.set(g, 10, 16, 'G'); L.set(g, 11, 16, 'G');     // keep entrance
L.set(g, 10, 17, 'T');                            // throne (boss)
L.set(g, 9, 16, 'B'); L.set(g, 12, 16, 'B');      // braziers flanking the keep door
// courtyard pillars
[[6, 9], [15, 9], [6, 13], [15, 13]].forEach(([x, y]) => { if (g[y][x] === 'I') L.set(g, x, y, 'L'); });

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  { x: REX[0], y: REX[1], ch: '&' },
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
cfg.newRecruits[0].x = REX[0]; cfg.newRecruits[0].y = REX[1];
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

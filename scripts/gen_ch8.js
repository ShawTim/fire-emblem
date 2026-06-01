// Redesign ch8 鋼鉄之要塞 — a tiered iron fortress (22x20, boss=Gerhardt).
// Climb from the bottom entrance up through walled tiers joined by gate chokepoints
// (zigzag center/side), archer towers, and a heavy final line, to the top keep.
// Helga defects T5; T4 side-gate pincer, T6 keep reserve. Positions remapped by index.
const L = require('./genlib');
const DIR = 'ch8_mountain';
const W = 22, H = 20;
const g = L.makeGrid(W, H, 'W');
const S = (x, y, c) => L.set(g, x, y, c);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[10, 18], [9, 18], [11, 18], [9, 17], [8, 18], [11, 17], [12, 18], [8, 17], [12, 17], [7, 18]]; // eirine,marcus,lina,thor,serra,cain,fran,rex,natasha,olivier
const HELGA = [10, 10];                                 // recruit T5 (mid fortress)
const ENEMIES = [
  [3, 2], [18, 2], [8, 3], [13, 3],            // 0-3 keep (snipers on towers, knights)
  [5, 6], [16, 6], [8, 6], [13, 6], [10, 7],   // 4-8 tier2 (knights, mage-knights, general)
  [4, 10], [17, 10], [7, 10], [14, 10], [10, 11], // 9-13 tier3 (paladins, knights, general)
  [5, 13], [16, 13], [8, 13], [13, 13],        // 14-17 tier4 (paladins, snipers)
  [6, 14], [15, 14], [10, 14], [9, 14], [12, 14], // 18-22 tier4 line (knights, wall-general)
  [10, 1],                                      // 23 boss Gerhardt (keep)
];
const REINFORCE = {
  4: [[3, 10], [18, 10], [4, 13], [17, 13], [2, 11], [19, 11]],   // side-gate pincer
  6: [[6, 3], [15, 3], [10, 3], [6, 2], [15, 2]],                 // keep reserve "鐵衛"
};

// ---- terrain --------------------------------------------------------------
L.rect(g, 2, 1, 19, 18, 'I', true);             // hollow fortress interior
S(10, 19, 'G'); S(11, 19, 'G');                 // bottom entrance gate
// tier dividers with gate chokepoints (zigzag centre / sides)
function tier(y, gaps) { L.hline(g, 2, 19, y, 'W'); gaps.forEach(gx => { S(gx, y, 'G'); S(gx + 1, y, 'G'); }); }
tier(4, [10]); tier(8, [5, 15]); tier(12, [10]); tier(15, [5, 15]);
// archer towers (snipers) + boss throne + ambiance
[[3, 2], [18, 2], [8, 13], [13, 13]].forEach(([x, y]) => S(x, y, 'O'));
S(10, 1, 'T');                                   // boss throne (keep)
S(6, 1, 'B'); S(14, 1, 'B');                     // keep braziers
[[12, 2], [6, 7], [15, 7], [6, 11], [14, 11], [10, 17]].forEach(([x, y]) => { if (g[y][x] === 'I') S(x, y, 'L'); });

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  { x: HELGA[0], y: HELGA[1], ch: '&' },
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
cfg.newRecruits[0].x = HELGA[0]; cfg.newRecruits[0].y = HELGA[1];
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

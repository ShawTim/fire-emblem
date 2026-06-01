// Redesign ch9 翠星之神殿 — a grand cathedral temple (20x22, boss=Zarba).
// Central nave climbs from the bottom entrance to the altar dais up top; flanking
// colonnades of emerald pillars give cover; undead + cult mages defend in depth.
// Positions remapped by index; roster/turnEvents/dialogue preserved.
const L = require('./genlib');
const DIR = 'ch9_castle';
const W = 20, H = 22;
const g = L.makeGrid(W, H, 'W');
const S = (x, y, c) => L.set(g, x, y, c);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[9, 20], [8, 20], [10, 20], [8, 19], [7, 20], [10, 19], [11, 20], [7, 19], [11, 19], [12, 20], [6, 20]]; // eirine,marcus,lina,thor,serra,cain,fran,rex,natasha,olivier,helga
const ENEMIES = [
  [5, 3], [14, 3], [7, 4], [12, 4], [9, 5],            // 0-4 altar flank
  [5, 6], [14, 6], [3, 6], [16, 6], [8, 7], [11, 7],   // 5-10 upper hall (aggr skel)
  [6, 8], [13, 8], [3, 9], [16, 9], [8, 9], [11, 9],   // 11-16 mid hall (aggr skel)
  [6, 11], [13, 11], [4, 11], [15, 11], [3, 12], [16, 12], // 17-22 lower hall (def)
  [7, 13], [12, 13], [4, 13], [15, 13], [8, 14], [11, 14], // 23-28 rearguard (def; y14 leaves a buffer)
  [9, 1],                                              // 29 boss Zarba (altar)
];
const REINFORCE = {
  4: [[5, 12], [14, 12], [4, 13], [15, 13], [6, 13], [13, 13]],
  6: [[3, 9], [16, 9], [2, 7], [17, 7], [9, 8]],
};

// ---- terrain --------------------------------------------------------------
L.rect(g, 2, 1, 17, 20, 'I', true);             // temple hall interior
S(9, 21, 'G'); S(10, 21, 'G');                  // bottom entrance
// altar dais (top): throne + stair steps + braziers
S(9, 1, 'T');
[[8, 2], [9, 2], [10, 2], [11, 2]].forEach(([x, y]) => S(x, y, 'Z'));
S(6, 1, 'B'); S(13, 1, 'B');
// flanking colonnades of emerald pillars + aisle braziers
for (let y = 4; y <= 18; y += 2) { S(5, y, 'L'); S(14, y, 'L'); }
for (let y = 5; y <= 17; y += 4) { S(2, y, 'B'); S(17, y, 'B'); }

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
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

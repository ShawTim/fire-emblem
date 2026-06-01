// Redesign ch6 裏切之港 — a port assault (22x18, seize the harbor command post).
// Harbor sea + piers along the top, the admiral's command post (seize fort) on the
// quay, a built-up port of warehouses + dock streets below, party lands SW.
// Natasha flies in T3. Roster/turnEvents/dialogue preserved, positions by index.
const L = require('./genlib');
const DIR = 'ch6_forest';
const W = 22, H = 18;
const rng = L.mulberry32(0x60127A4);
const g = L.makeGrid(W, H, 'P');
const S = (x, y, c) => L.set(g, x, y, c);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[4, 15], [3, 15], [5, 15], [4, 16], [3, 16], [5, 16], [6, 16], [7, 15]]; // eirine,marcus,lina,thor,serra,cain,fran,rex
const NATASHA = [16, 15];                              // recruit (flying) T3, south
const SEIZE = [8, 2];                                  // harbor command post (fort)
const ENEMIES = [
  [5, 3], [13, 3],     // 0,1 knights (quay guards)
  [7, 3], [11, 3],     // 2,3 mages (quay)
  [4, 4], [15, 4],     // 4,5 brigands (pirates, flanks; off walls)
  [8, 5], [11, 5],     // 6,7 soldiers (aggressive)
  [5, 6], [14, 6],     // 8,9 soldiers (defensive)
  [9, 7],              // 10 fighter (dock thug)
  [3, 8], [8, 7], [12, 8], [16, 8],   // 11 brigand,12 archer,13 knight,14 soldier
  [10, 9], [13, 9],    // 15 knight, 16 archer(killerBow)
  [16, 9], [12, 10],   // 17 fighter, 18 archer (east, away from SW party)
  [10, 10],            // 19 soldier (centre)
  [9, 2],              // 20 boss 提督巴爾薩 (quay, beside HQ)
];
const REINFORCE = {
  4: [[20, 11], [21, 11], [20, 10], [1, 11], [0, 12]],   // dock pirates east + west
};

// ---- terrain --------------------------------------------------------------
// harbor sea (top) + piers jutting in
L.rect(g, 0, 0, W - 1, 1, 'E', true);
[[4, 1], [4, 0], [14, 1], [14, 0], [18, 1], [18, 0]].forEach(([x, y]) => S(x, y, 'X'));
// quay / waterfront walk + command post
L.hline(g, 1, W - 2, 2, 'D');
S(SEIZE[0], SEIZE[1], 'O');
// warehouses (wall blocks), wide streets between; keep center lane + SW landing clear
const wh = (x, y) => L.rect(g, x, y, x + 1, y + 1, 'W', true);
[[2, 4], [13, 4], [17, 4], [4, 7], [13, 7], [18, 7], [2, 10], [16, 10], [18, 13]].forEach(([x, y]) => wh(x, y));
// dock streets
L.vline(g, 10, 3, 16, 'D');          // central approach to the command post
L.hline(g, 1, W - 2, 12, 'D');       // main dock road
// crates scattered as light cover (ruins) + a little organic green inland (SW)
[[6, 9], [12, 6], [15, 12], [7, 13]].forEach(([x, y]) => { if (g[y][x] === 'P') S(x, y, 'U'); });
// pave the dock core with stone (cost-1 floor, no balance change); keep grassy landing below
for (let y = 2; y <= 12; y++) for (let x = 1; x <= W - 2; x++) if (g[y][x] === 'P') g[y][x] = 'I';
L.blob(g, 2, 16, 2, 'F', 0.5, rng); L.blob(g, 20, 16, 2, 'F', 0.5, rng);

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  { x: NATASHA[0], y: NATASHA[1], ch: '&' },
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
cfg.newRecruits[0].x = NATASHA[0]; cfg.newRecruits[0].y = NATASHA[1];
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
cfg.seizePos = { x: SEIZE[0], y: SEIZE[1] };
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

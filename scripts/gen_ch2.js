// Redesign ch2 北境之村 — a larger, organic burning-village map (22x18).
// Generates terrain.txt and repositions units in config.json by index
// (all classes/levels/items/names/narrative text preserved verbatim).
const L = require('./genlib');
const DIR = 'ch2_village';
const W = 22, H = 18;
const rng = L.mulberry32(0x2C0FFEE);

// ---- unit layout ----------------------------------------------------------
const PLAYERS = [[11, 11], [10, 11], [12, 11]];          // eirine, marcus, lina
const RECRUITS = [[10, 12], [12, 12]];                   // thor, serra (T1)
const SEIZE = [11, 2];                                    // command plaza (fort)
// enemies in config order (idx0..13): boss cluster(5) + house looters(6) + roamers(3)
const ENEMIES = [
  [11, 2],  // 0 guardCaptain boss (on fort)
  [11, 1],  // 1 soldier  guard N
  [11, 3],  // 2 soldier  guard S (blocks central street)
  [9, 2],   // 3 archer   guard W
  [13, 2],  // 4 archer   guard E
  [3, 2],   // 5 mage fire    H1 NW house
  [18, 2],  // 6 soldier      H2 NE house
  [2, 8],   // 7 fighter      H3 W house
  [19, 8],  // 8 fighter      H4 E house
  [3, 14],  // 9 soldier slim H5 SW house
  [4, 10],  // 10 soldier slim roam W street
  [6, 5],   // 11 mage thunder roam NW field
  [18, 14], // 12 fighter handAxe H6 SE house
  [17, 9],  // 13 soldier      roam E street
];
const HOUSES = [[3, 2], [18, 2], [2, 8], [19, 8], [3, 14], [18, 14], [10, 15]];
// villageEvents config order (idx0..6): elder(near start) then the 6 looter houses
const VILLAGES = [[10, 15], [3, 2], [18, 2], [2, 8], [19, 8], [3, 14], [18, 14]];
const REINFORCE = { 2: [[1, 16], [20, 16]], 3: [[18, 4]], 6: [[11, 0]] };

// ---- terrain --------------------------------------------------------------
const g = L.makeGrid(W, H, 'P');

// organic outskirts: forest/hill groves at the four corners + a few field copses
L.blob(g, 1, 1, 3, 'F', 0.7, rng);
L.blob(g, W - 2, 1, 3, 'F', 0.7, rng);
L.blob(g, 1, H - 2, 3, 'H', 0.6, rng);
L.blob(g, W - 2, H - 2, 3, 'F', 0.6, rng);
L.blob(g, 7, 5, 2, 'F', 0.6, rng);
L.blob(g, 15, 6, 2, 'F', 0.6, rng);
L.blob(g, 8, 16, 2, 'H', 0.5, rng);
L.blob(g, 14, 16, 2, 'F', 0.5, rng);
// hills backing the village to the north
L.blob(g, 5, 0, 2, 'H', 0.5, rng);
L.blob(g, 17, 0, 2, 'H', 0.5, rng);

// streets: one main N-S spine + two cross streets
L.vline(g, 11, 0, 16, 'D');
L.hline(g, 2, W - 3, 8, 'D');
L.hline(g, 2, W - 3, 14, 'D');
// short connector lanes toward the side houses
L.hline(g, 2, 5, 2, 'D'); L.hline(g, W - 6, W - 3, 2, 'D');
L.vline(g, 11, 12, 16, 'D');

// command plaza (paved) with the seize fort at its centre
L.rect(g, 9, 1, 13, 3, 'D', true);
L.set(g, SEIZE[0], SEIZE[1], 'O');

// houses
HOUSES.forEach(([x, y]) => L.set(g, x, y, 'V'));

L.printGrid(g, [
  ...PLAYERS.map(p => ({ x: p[0], y: p[1], ch: '@' })),
  ...RECRUITS.map(p => ({ x: p[0], y: p[1], ch: '&' })),
  ...ENEMIES.map(p => ({ x: p[0], y: p[1], ch: 'e' })),
]);
console.log('terrain ->', L.writeTerrain(DIR, g));

// ---- config patch ---------------------------------------------------------
const cfg = L.readConfig(DIR);
cfg.width = W; cfg.height = H;
PLAYERS.forEach((p, i) => { cfg.playerUnits[i].x = p[0]; cfg.playerUnits[i].y = p[1]; });
RECRUITS.forEach((p, i) => { cfg.newRecruits[i].x = p[0]; cfg.newRecruits[i].y = p[1]; });
ENEMIES.forEach((p, i) => { cfg.enemies[i].x = p[0]; cfg.enemies[i].y = p[1]; });
VILLAGES.forEach((p, i) => { cfg.villageEvents[i].x = p[0]; cfg.villageEvents[i].y = p[1]; });
cfg.seizePos = { x: SEIZE[0], y: SEIZE[1] };
for (const ev of cfg.turnEvents) {
  if (ev.enemies && REINFORCE[ev.turn]) {
    ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  }
}
console.log('config  ->', L.writeConfig(DIR, cfg));

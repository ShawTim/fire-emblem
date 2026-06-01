// Redesign ch10 最終章 翠星之戰 — the royal palace throne assault (24x20, boss=Morgane).
// Marble hall: a central red-carpet aisle climbs from the王都 entrance to Morgane's
// throne dais; colonnades + corner spires; elite defenders in depth (defensive near
// the party per the original T1 balance). D4 ally wave + D3 star-crest surge preserved.
const L = require('./genlib');
const DIR = 'ch10_final';
const W = 24, H = 20;
const g = L.makeGrid(W, H, 'W');
const S = (x, y, c) => L.set(g, x, y, c);

// ---- unit layout (config order preserved) --------------------------------
const PLAYERS = [[11, 18], [10, 18], [12, 18], [10, 17], [9, 18], [13, 18], [13, 17], [9, 17], [14, 18], [14, 17], [8, 18]]; // eirine,marcus,lina,thor,serra,cain,fran,rex,natasha,olivier,helga
const ENEMIES = [
  [7, 2], [16, 2], [5, 2], [18, 2], [9, 3], [14, 3],   // 0-5 throne guard
  [8, 4], [15, 4], [11, 4], [4, 5], [19, 5],           // 6-10 upper
  [4, 7], [19, 7], [9, 8], [14, 8],                    // 11-14
  [6, 9], [17, 9], [10, 10], [13, 10],                 // 15-18
  [4, 11], [19, 11], [11, 11], [7, 13], [16, 13], [12, 13], // 19-24
  [5, 14], [18, 14], [9, 15], [14, 15], [6, 16], [17, 16], // 25-30 lower (defensive)
  [11, 1],                                             // 31 boss Morgane (throne)
];
const REINFORCE = {
  3: [[2, 6], [21, 6], [11, 5], [3, 7], [20, 7]],                 // black-eagle guard wings
  6: [[2, 8], [21, 8], [11, 7], [5, 7], [18, 7], [11, 6]],        // final line
};
const ALLY_RE = { 4: [[2, 18], [4, 18], [19, 18], [21, 18]] };    // D4 coalition wave (bottom corners)

// ---- terrain --------------------------------------------------------------
L.rect(g, 2, 1, 21, 18, 'I', true);             // palace marble hall
S(11, 19, 'G'); S(12, 19, 'G');                 // 王都 entrance
// throne dais (top centre)
S(11, 1, 'T'); S(12, 1, 'T');
S(10, 2, 'Z'); S(13, 2, 'Z');                   // dais steps
S(8, 1, 'B'); S(15, 1, 'B');                    // throne braziers
// central red-carpet aisle to the throne
L.vline(g, 11, 3, 18, 'D'); L.vline(g, 12, 3, 18, 'D');
// colonnades flanking the aisle + outer columns
for (let y = 4; y <= 16; y += 2) { S(7, y, 'L'); S(16, y, 'L'); }
for (let y = 4; y <= 16; y += 4) { S(4, y, 'L'); S(19, y, 'L'); }
// corner spires (sages/generals)
[[3, 2], [20, 2], [3, 9], [20, 9]].forEach(([x, y]) => S(x, y, 'O'));

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
  if (ev.enemies && REINFORCE[ev.turn]) ev.enemies.forEach((e, i) => { if (REINFORCE[ev.turn][i]) { e.x = REINFORCE[ev.turn][i][0]; e.y = REINFORCE[ev.turn][i][1]; } });
  if (ev.allies && ALLY_RE[ev.turn]) ev.allies.forEach((a, i) => { if (ALLY_RE[ev.turn][i]) { a.x = ALLY_RE[ev.turn][i][0]; a.y = ALLY_RE[ev.turn][i][1]; } });
}
console.log('config  ->', L.writeConfig(DIR, cfg));

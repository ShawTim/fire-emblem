// Generate ch1 (24x18) terrain.txt — deliberate structure + seeded organic speckle.
// Design: player start SW, boss camp NE on a fort, a meandering 2-wide river
// splitting N/S with two 2-wide bridges (west cols 5-6, east cols 16-17),
// forest cover clusters, hill ridges for archers, mountains framing the corners.
// Run: node scripts/gen_ch1_terrain.js  (writes maps/ch1_wilderness/terrain.txt)
const fs = require('fs');
const path = require('path');

const W = 24, H = 18;

// --- seeded RNG (mulberry32) so the "random" feel is reproducible ---
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(0x1A3C5E7);

// grid[y][x]; start as plain
const g = Array.from({ length: H }, () => Array(W).fill('P'));
const inB = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
const set = (x, y, c) => { if (inB(x, y)) g[y][x] = c; };
const isP = (x, y) => inB(x, y) && g[y][x] === 'P';

// --- 1) River: meandering, 2 tiles wide (rows rr[x], rr[x]+1) ---
const rr = [9,9,9,8,8,8,8,9,9,9,10,10,10,10,9,9,8,8,8,8,9,9,9,9];
const WEST_BRIDGE = [5, 6], EAST_BRIDGE = [16, 17];
const bridgeCols = new Set([...WEST_BRIDGE, ...EAST_BRIDGE]);
for (let x = 0; x < W; x++) {
  set(x, rr[x], 'R');
  set(x, rr[x] + 1, 'R');
}
// --- 2) Bridges span both river rows at the chosen columns ---
for (const x of bridgeCols) {
  set(x, rr[x], 'X');
  set(x, rr[x] + 1, 'X');
}

// --- 3) Forest clusters: deliberate centers, seeded jitter for an organic blob ---
function blob(cx, cy, r, fill, prob) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d > r) continue;
      if (!isP(cx + dx, cy + dy)) continue;
      // denser in the middle, ragged at the edge
      const p = d === 0 ? 1 : prob * (1 - (d - 1) / (r + 1));
      if (rng() < p) set(cx + dx, cy + dy, fill);
    }
  }
}
// player-side cover (south of river)
blob(4, 13, 2, 'F', 0.8);
blob(8, 14, 2, 'F', 0.75);
blob(11, 13, 2, 'F', 0.7);
// midfield (around bridges, south & north banks)
blob(10, 11, 2, 'F', 0.65);
blob(15, 12, 2, 'F', 0.7);
// north / enemy side cover
blob(9, 6, 2, 'F', 0.7);
blob(13, 8, 2, 'F', 0.65);
blob(5, 3, 2, 'F', 0.7);
blob(18, 6, 2, 'F', 0.7);

// --- 4) Hill ridges (archer vantage + boss camp ring) ---
const hills = [
  // archer vantage points (match enemy archer tiles below)
  [15, 4], [13, 6], [20, 4],
  // boss camp ring (NE)
  [18, 1], [20, 1], [18, 3], [20, 3], [17, 2], [21, 3], [21, 1],
  // scattered relief
  [3, 10], [16, 13], [7, 4], [12, 3],
];
for (const [x, y] of hills) if (isP(x, y)) set(x, y, 'H');
// a couple of small hill blobs for texture
blob(2, 11, 1, 'H', 0.6);
blob(22, 5, 1, 'H', 0.6);

// --- 5) Mountains framing the corners + a short north ridge ---
const mtns = [
  [0, 0], [1, 0], [0, 1], [23, 0], [22, 0], [23, 1], [23, 2],
  [0, 16], [0, 17], [1, 17], [23, 16], [23, 17], [22, 17],
  // north ridge gap-teeth
  [10, 0], [11, 0], [14, 0],
];
for (const [x, y] of mtns) if (isP(x, y)) set(x, y, 'M');

// --- 6) Objects: forts, villages, ruins ---
set(4, 16, 'O');   // player retreat fort (SW)
set(19, 2, 'O');   // boss fort (NE) == seizePos
set(9, 12, 'V');   // player-reachable village (south)
set(20, 6, 'V');   // contested village near boss
set(12, 2, 'U');   // ruins flavor (north)
set(6, 3, 'U');    // ruins flavor (NW)

// --- 7) Guarantee unit tiles are passable. Player units + a 1-tile breathing pad. ---
const playerTiles = [[3, 15], [2, 16], [4, 14]];
for (const [ux, uy] of playerTiles) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = ux + dx, y = uy + dy;
      if (!inB(x, y)) continue;
      const c = g[y][x];
      if (c === 'M' || c === 'R') set(x, y, 'P'); // never box-in or drown the start
    }
  }
  set(ux, uy, g[uy][ux] === 'O' ? 'O' : 'P');
}

// Enemy tiles must not be river/mountain (bridges/hills/forts are fine).
const enemyTiles = [
  [6, 9], [17, 9], [9, 7], [12, 8], [14, 6], [15, 4], [8, 5],
  [11, 4], [16, 3], [20, 4], [18, 4], [19, 2], [21, 3], [13, 6],
];
for (const [x, y] of enemyTiles) {
  const c = g[y][x];
  if (c === 'R' || c === 'M') set(x, y, 'P');
}

// --- write + print ---
const out = g.map(row => row.join('')).join('\n') + '\n';
const dest = path.join(__dirname, '..', 'maps', 'ch1_wilderness', 'terrain.txt');
fs.writeFileSync(dest, out);

// annotated print for review
console.log('   ' + Array.from({ length: W }, (_, i) => i % 10).join(''));
g.forEach((row, y) => {
  console.log(String(y).padStart(2, ' ') + ' ' + row.join(''));
});
console.log('\nwrote', dest, `(${W}x${H})`);

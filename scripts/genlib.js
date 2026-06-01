// genlib.js — shared terrain-authoring helpers for chapter map generation.
// Grid is an array of char-rows (TERRAIN_CODES). Helpers mutate in place.
const fs = require('fs');
const path = require('path');

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrid(w, h, fill) {
  const g = [];
  for (let y = 0; y < h; y++) g[y] = new Array(w).fill(fill || 'P');
  g.w = w; g.h = h;
  return g;
}
const inb = (g, x, y) => x >= 0 && y >= 0 && x < g.w && y < g.h;
const set = (g, x, y, c) => { if (inb(g, x, y)) g[y][x] = c; };
const get = (g, x, y) => (inb(g, x, y) ? g[y][x] : null);
function rect(g, x0, y0, x1, y1, c, filled) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (filled || x === x0 || x === x1 || y === y0 || y === y1) set(g, x, y, c);
}
const hline = (g, x0, x1, y, c) => { for (let x = x0; x <= x1; x++) set(g, x, y, c); };
const vline = (g, x, y0, y1, c) => { for (let y = y0; y <= y1; y++) set(g, x, y, c); };

// Diamond-ish organic blob; prob>=1 = solid, else denser toward center.
function blob(g, cx, cy, r, c, prob, rng) {
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const d = Math.abs(x - cx) + Math.abs(y - cy);
    if (d > r) continue;
    if (prob >= 1 || rng() < prob * (1 - d / (r + 1) + 0.25)) set(g, x, y, c);
  }
}
function border(g, c, thick) {
  thick = thick || 1;
  for (let t = 0; t < thick; t++) {
    hline(g, t, g.w - 1 - t, t, c); hline(g, t, g.w - 1 - t, g.h - 1 - t, c);
    vline(g, t, t, g.h - 1 - t, c); vline(g, g.w - 1 - t, t, g.h - 1 - t, c);
  }
}
// Replace only 'P' cells with c at probability, skipping avoid(x,y) cells.
function sprinkle(g, c, prob, rng, avoid) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (g[y][x] !== 'P') continue;
    if (avoid && avoid(x, y)) continue;
    if (rng() < prob) g[y][x] = c;
  }
}
const nearAny = (pts, x, y, rad) => pts.some(p => Math.abs(p[0] - x) + Math.abs(p[1] - y) <= rad);

const toText = (g) => g.map(r => r.join('')).join('\n') + '\n';

function writeTerrain(dir, g) {
  const p = path.join(__dirname, '..', 'maps', dir, 'terrain.txt');
  fs.writeFileSync(p, toText(g));
  return p;
}
function readConfig(dir) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'maps', dir, 'config.json'), 'utf8'));
}
function writeConfig(dir, cfg) {
  const p = path.join(__dirname, '..', 'maps', dir, 'config.json');
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n');
  return p;
}
// Pretty terrain dump with column ruler and optional unit marks for sanity-check.
function printGrid(g, marks) {
  const copy = g.map(r => r.slice());
  (marks || []).forEach(m => { if (inb(g, m.x, m.y)) copy[m.y][m.x] = m.ch; });
  console.log('    ' + [...Array(g.w).keys()].map(i => i % 10).join(''));
  copy.forEach((r, y) => console.log(String(y).padStart(3) + ' ' + r.join('')));
}

module.exports = {
  mulberry32, makeGrid, inb, set, get, rect, hline, vline, blob, border,
  sprinkle, nearAny, toText, writeTerrain, readConfig, writeConfig, printGrid,
};

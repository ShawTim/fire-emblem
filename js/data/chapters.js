// chapters.js — Dynamic chapter loader
// Each chapter loads from maps/ch{X}_{name}/terrain.txt + config.json

// Character definitions (kept in JS for portrait/accessibility)
const CHARACTERS = {
  eirine: { name: '艾琳', classId: 'lord', level: 1, isLord: true, portrait: { hair: '#c4a', eyes: '#48f', skin: '#fdb' }, baseStats: { hp: 19, str: 4, mag: 1, skl: 7, spd: 9, lck: 9, def: 4, res: 3 }, growths: { hp: 75, str: 50, mag: 15, skl: 50, spd: 60, lck: 60, def: 30, res: 30 }, items: ['rapier'] },
  marcus: { name: '馬庫斯', classId: 'paladin', level: 1, portrait: { hair: '#666', eyes: '#432', skin: '#eca' }, baseStats: { hp: 28, str: 10, mag: 1, skl: 12, spd: 7, lck: 8, def: 9, res: 6 }, growths: { hp: 40, str: 20, mag: 5, skl: 20, spd: 10, lck: 20, def: 15, res: 10 }, items: ['steelSword', 'ironLance', 'vulnerary'] },
  lina: { name: '莉娜', classId: 'archer', level: 1, portrait: { hair: '#6c4', eyes: '#4a4', skin: '#fdb' }, baseStats: { hp: 17, str: 5, mag: 0, skl: 7, spd: 7, lck: 4, def: 3, res: 1 }, growths: { hp: 55, str: 40, mag: 5, skl: 55, spd: 55, lck: 35, def: 20, res: 20 }, items: ['ironBow'] },
  thor: { name: '托爾', classId: 'fighter', level: 3, portrait: { hair: '#d82', eyes: '#654', skin: '#dba' }, baseStats: { hp: 24, str: 8, mag: 0, skl: 4, spd: 4, lck: 3, def: 5, res: 0 }, growths: { hp: 80, str: 55, mag: 5, skl: 30, spd: 25, lck: 25, def: 35, res: 10 }, items: ['ironAxe', 'handAxe'] },
  serra: { name: '賽拉', classId: 'cleric', level: 2, portrait: { hair: '#ffa', eyes: '#88f', skin: '#fed' }, baseStats: { hp: 16, str: 1, mag: 5, skl: 4, spd: 6, lck: 7, def: 1, res: 7 }, growths: { hp: 45, str: 5, mag: 55, skl: 30, spd: 35, lck: 45, def: 10, res: 55 }, items: ['heal'] },
  cain: { name: '凱恩', classId: 'mercenary', level: 5, portrait: { hair: '#444', eyes: '#a44', skin: '#dba' }, baseStats: { hp: 22, str: 8, mag: 0, skl: 9, spd: 10, lck: 5, def: 6, res: 1 }, growths: { hp: 65, str: 45, mag: 5, skl: 45, spd: 45, lck: 30, def: 30, res: 15 }, items: ['ironSword', 'vulnerary'] },
  fran: { name: '法蘭', classId: 'mage', level: 5, portrait: { hair: '#88f', eyes: '#f44', skin: '#fdb' }, baseStats: { hp: 18, str: 1, mag: 9, skl: 6, spd: 8, lck: 4, def: 2, res: 6 }, growths: { hp: 40, str: 5, mag: 65, skl: 40, spd: 45, lck: 25, def: 10, res: 40 }, items: ['fire', 'thunder'] },
  rex: { name: '雷克斯', classId: 'wyvernRider', level: 7, portrait: { hair: '#854', eyes: '#484', skin: '#dba' }, baseStats: { hp: 26, str: 10, mag: 0, skl: 8, spd: 7, lck: 4, def: 10, res: 1 }, growths: { hp: 60, str: 45, mag: 5, skl: 35, spd: 35, lck: 20, def: 40, res: 10 }, items: ['steelLance', 'javelin'] },
  natasha: { name: 'ナターシャ', classId: 'pegasusKnight', level: 8, portrait: { hair: '#f8a', eyes: '#4cf', skin: '#fdb' }, baseStats: { hp: 20, str: 7, mag: 3, skl: 9, spd: 13, lck: 8, def: 4, res: 8 }, growths: { hp: 50, str: 35, mag: 20, skl: 45, spd: 60, lck: 40, def: 15, res: 45 }, items: ['ironLance', 'javelin'] },
  olivier: { name: 'オリヴィエ', classId: 'thief', level: 8, portrait: { hair: '#555', eyes: '#a8a', skin: '#ecb' }, baseStats: { hp: 21, str: 6, mag: 0, skl: 12, spd: 15, lck: 5, def: 4, res: 2 }, growths: { hp: 50, str: 30, mag: 5, skl: 55, spd: 65, lck: 30, def: 20, res: 15 }, items: ['ironSword'] },
  helga: { name: 'ヘルガ', classId: 'general', level: 1, portrait: { hair: '#964', eyes: '#644', skin: '#d9b' }, baseStats: { hp: 30, str: 14, mag: 0, skl: 7, spd: 3, lck: 2, def: 16, res: 4 }, growths: { hp: 60, str: 40, mag: 0, skl: 20, spd: 15, lck: 15, def: 50, res: 20 }, items: ['steelLance', 'javelin'] },
  morgane: { name: '莫爾甘', portrait: { hair: '#206', eyes: '#f0f', skin: '#baa' } }
};

const CHAPTER_MANIFEST = [
  { id: 0, dir: 'ch0_prologue', file: '序章' },
  { id: 1, dir: 'ch1_wilderness', file: '第一章' },
  { id: 2, dir: 'ch2_village', file: '第二章' },
  { id: 3, dir: 'ch3_castle', file: '第三章' },
  { id: 4, dir: 'ch4_church', file: '第四章' },
  { id: 5, dir: 'ch5_river', file: '第五章' },
  { id: 6, dir: 'ch6_forest', file: '第六章' },
  { id: 7, dir: 'ch7_desert', file: '第七章' },
  { id: 8, dir: 'ch8_mountain', file: '第八章' },
  { id: 9, dir: 'ch9_castle', file: '第九章' },
  { id: 10, dir: 'ch10_final', file: '最終章' },
];

// Parse terrain codes
const TERRAIN_CODES = {
  P: 'plain', F: 'forest', M: 'mountain',
  W: 'wall', G: 'gate', R: 'river',
  V: 'village', I: 'floor', T: 'throne',
  L: 'pillar', O: 'fort', '+': 'fort',
  '.': 'plain', ' ': 'plain'
};

function parseTerrain(text, w, h) {
  const lines = text.trim().split('\n');
  const map = [];
  for (let y = 0; y < h; y++) {
    map[y] = [];
    const row = lines[y] || '';
    for (let x = 0; x < w; x++) {
      const code = row[x] || '.';
      map[y][x] = TERRAIN_CODES[code] || 'plain';
    }
  }
  return map;
}

// Load chapter data dynamically
async function loadChapter(chapterId) {
  const manifest = CHAPTER_MANIFEST.find(c => c.id === chapterId);
  if (!manifest) {
    console.error('Chapter not found:', chapterId);
    return null;
  }

  const basePath = `maps/${manifest.dir}`;

  try {
    // Load config.json
    const configRes = await fetch(`${basePath}/config.json`);
    if (!configRes.ok) throw new Error(`Failed to load config for chapter ${chapterId}`);
    const config = await configRes.json();

    // Load terrain.txt
    const terrainRes = await fetch(`${basePath}/terrain.txt`);
    if (!terrainRes.ok) throw new Error(`Failed to load terrain for chapter ${chapterId}`);
    const terrainText = await terrainRes.text();

    // Parse terrain
    const terrain = parseTerrain(terrainText, config.width, config.height);

    // Merge everything
    return {
      ...config,
      terrain: terrain,
      _loaded: true
    };

  } catch (err) {
    console.error('Error loading chapter:', err);
    // Fallback: return minimal chapter data
    return {
      id: chapterId,
      title: manifest.file,
      subtitle: '載入失敗',
      objective: 'rout',
      width: 10,
      height: 10,
      terrain: parseTerrain('.'.repeat(10).repeat(10), 10, 10),
      playerUnits: [],
      enemies: [],
      dialogues: {}
    };
  }
}

// Cache for loaded chapters
const chapterCache = {};

// Get chapter (async)
async function getChapter(chapterId) {
  if (chapterCache[chapterId]) {
    return chapterCache[chapterId];
  }
  const chapter = await loadChapter(chapterId);
  chapterCache[chapterId] = chapter;
  return chapter;
}

// Preload all chapters
async function preloadChapters() {
  const promises = CHAPTER_MANIFEST.map(c => loadChapter(c.id));
  const chapters = await Promise.all(promises);
  chapters.forEach(c => {
    if (c) chapterCache[c.id] = c;
  });
  return chapters;
}

// Export for compatibility with old code
// This creates a proxy that loads chapters on demand
const CHAPTERS = new Proxy([], {
  get(target, prop) {
    if (prop === 'length') return CHAPTER_MANIFEST.length;
    if (typeof prop === 'string' && !isNaN(prop)) {
      const id = parseInt(prop);
      const chapter = chapterCache[id];
      if (chapter) return chapter;
      console.warn('Chapter not preloaded:', id);
      return null;
    }
    return target[prop];
  }
});

// Export globals for use in other modules
window.CHAPTER_MANIFEST = CHAPTER_MANIFEST;
window.getChapter = getChapter;
window.preloadChapters = preloadChapters;

// For backward compatibility - load all chapters synchronously (deprecated)
// Use async getChapter() or preloadChapters() instead
function loadAllChaptersSync() {
  console.warn('loadAllChaptersSync is deprecated. Use preloadChapters() instead.');
  return CHAPTERS;
}
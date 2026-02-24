// chapters.js — Dynamic chapter loader
// Each chapter loads from maps/ch{X}_{name}/terrain.txt + config.json

const CHAPTER_MANIFEST = [
  { id: 0, dir: 'ch0_prologue', file: '序章' },
  { id: 1, dir: 'ch1_wilderness', file: '第一章' },
  { id: 2, dir: 'ch2_village', file: '第二章' },
  { id: 3, dir: 'ch3_castle', file: '第三章' },
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
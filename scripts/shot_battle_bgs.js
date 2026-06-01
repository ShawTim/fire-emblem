// Capture the terrain-ified battle backgrounds for every terrain type.
// Starts a real battle, freezes it in a visible phase, then cycles terrainType.
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/battle_bgs';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TERRAINS = ['plain', 'forest', 'hill', 'mountain', 'river', 'desert',
  'fort', 'village', 'wall', 'gate', 'floor', 'throne', 'ruins', 'swamp'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', e => console.log('[ERR]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text()); });

  await page.goto('http://localhost:8081/?ch=2');
  await page.waitForFunction(() => typeof game !== 'undefined' && !!game, { timeout: 15000 });
  await page.evaluate(async () => {
    document.getElementById('title-screen').style.display = 'none';
    await game.startChapter(1);
    document.getElementById('chapter-title-card').classList.add('hidden');
  });
  await page.waitForFunction(() => game.chapterData && game.chapterData.id === 1);
  await page.evaluate(() => {
    game.dialogue.lines = []; game.dialogue.active = false; game.dialogue.onComplete = null;
    game.state = 'map'; game.beginPlayerPhase();
  });
  let safety = 200;
  while (await page.evaluate(() => game.dialogue.isActive()) && safety-- > 0) {
    await page.evaluate(() => game.dialogue.advance()); await sleep(15);
  }

  // Force a battle: Marcus vs nearest enemy.
  await page.evaluate(() => {
    const atk = game.units.find(u => u.name === '馬庫斯');
    const tgt = game.units.find(u => u.faction === 'enemy' && u.hp > 0);
    atk.x = tgt.x; atk.y = tgt.y - 1;
    game.startCombat(atk, tgt);
  });
  await page.waitForFunction(() => game.battleScene && game.battleScene.isActive(), { timeout: 8000 });

  for (const ter of TERRAINS) {
    // Paint scenery (+ ground platform) directly onto our own canvas — deterministic, no RAF.
    const dataUrl = await page.evaluate((t) => {
      const b = game.battleScene;
      const c = document.createElement('canvas'); c.width = 800; c.height = 600;
      const cx = c.getContext('2d');
      b._paintBg(cx, t, 800, 600);
      b._drawPlat(cx, 800, 600);
      b._drawTerrainLabel(cx, t, 800 - 120, 600 * 0.58);
      return c.toDataURL('image/png');
    }, ter);
    fs.writeFileSync(`${SHOT}/bg_${ter}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('saved bg_' + ter + '.png');
  }

  await browser.close();
})();

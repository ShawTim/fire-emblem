// Capture LIVE in-game battle composites (background + platform + units + label)
// by freezing a real battle at the 'ready' phase and cycling terrainType.
// Full-page screenshots (the live #gameCanvas) — reliable vs element/offscreen capture.
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/battle_live';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TERRAINS = ['plain', 'forest', 'mountain', 'river', 'sea', 'desert', 'fort', 'throne', 'swamp', 'gate'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 680 } });
  page.on('pageerror', e => console.log('[ERR]', e.message));
  await page.goto('http://localhost:8081/?ch=2');
  await page.waitForFunction(() => typeof game !== 'undefined' && !!game, { timeout: 15000 });
  await page.evaluate(async () => {
    document.getElementById('title-screen').style.display = 'none';
    await game.startChapter(1);
    const c = document.getElementById('chapter-title-card'); if (c) c.classList.add('hidden');
  });
  await page.waitForFunction(() => game.chapterData && game.chapterData.id === 1);
  await page.evaluate(() => { game.dialogue.lines = []; game.dialogue.active = false; game.dialogue.onComplete = null; game.state = 'map'; game.beginPlayerPhase(); });
  let s = 300; while (await page.evaluate(() => game.dialogue.isActive()) && s-- > 0) { await page.evaluate(() => game.dialogue.advance()); await sleep(8); }

  await page.evaluate(() => {
    const atk = game.units.find(u => u.name === '馬庫斯');
    const tgt = game.units.find(u => u.faction === 'enemy' && u.hp > 0);
    atk.x = tgt.x; atk.y = tgt.y - 1; game.startCombat(atk, tgt);
  });
  await page.waitForFunction(() => game.battleScene && game.battleScene.isActive(), { timeout: 8000 });

  // Freeze the scene on a clean, visible 'ready' frame.
  await page.evaluate(() => {
    const b = game.battleScene;
    b.update = function () {};
    b.phase = 'ready'; b.timer = 0; b.fadeAlpha = 0;
    b.attackerSlide = 0; b.defenderSlide = 0; b.panelAlpha = 1; b.vsAlpha = 0;
    b.critZoom = 0; b.shakeX = 0; b.shakeY = 0;
    b.attackerDead = false; b.defenderDead = false; b.deathAlpha = 1;
  });

  for (const ter of TERRAINS) {
    await page.evaluate((t) => { const b = game.battleScene; b.terrainType = t; b._bgKey = null; }, ter);
    await sleep(220);
    await page.screenshot({ path: `${SHOT}/live_${ter}.png` });
    console.log('saved live_' + ter + '.png');
  }
  await browser.close();
})();

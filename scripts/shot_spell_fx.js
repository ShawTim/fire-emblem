// Capture each magic-impact effect by pushing it directly onto a frozen battle.
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/spell_fx';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SPELLS = ['fire', 'thunder', 'wind', 'dark', 'light'];

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
  await page.evaluate(() => {
    const b = game.battleScene;
    b.update = function () {}; b.phase = 'ready'; b.fadeAlpha = 0; b.vsAlpha = 0; b.panelAlpha = 1;
    b.attackerSlide = 0; b.defenderSlide = 0; b.deathAlpha = 1; b.projProg = -1; b.critZoom = 0; b.shakeX = 0; b.shakeY = 0;
  });
  for (const sp of SPELLS) {
    await page.evaluate((spell) => {
      const b = game.battleScene;
      b.effects = [
        { type: 'spellFx', spell: spell, x: 600, y: 330, duration: 580, timer: 580 * (spell === 'thunder' ? 0.3 : 0.42) },
        { type: 'damage', x: 560, y: 300, text: '13', color: '#fff', duration: 800, timer: 120 },
      ];
    }, sp);
    await sleep(180);
    await page.screenshot({ path: `${SHOT}/spell_${sp}.png`, clip: { x: 55, y: 150, width: 800, height: 310 } });
    console.log('saved spell_' + sp + '.png');
  }
  await browser.close();
})();

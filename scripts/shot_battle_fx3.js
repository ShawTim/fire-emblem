// Capture weapon crit-flair (sword/axe/lance/bow), death shatter, and victory pose.
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/battle_fx3';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
    b.attackerDead = false; b.defenderDead = false;
  });

  // crit flair per weapon type
  for (const wt of ['sword', 'axe', 'lance', 'bow']) {
    await page.evaluate((w) => {
      const b = game.battleScene;
      b.phase = 'ready'; b.attackerDead = false; b.defenderDead = false;
      b.effects = [
        { type: 'critFlair', wt: w, x: 600, y: 330, dir: 1, duration: 380, timer: 380 * 0.4 },
        { type: 'ring', x: 600, y: 330, color: '#ffd700', duration: 420, timer: 420 * 0.4 },
      ];
    }, wt);
    await sleep(170);
    await page.screenshot({ path: `${SHOT}/crit_${wt}.png`, clip: { x: 55, y: 150, width: 800, height: 310 } });
    console.log('saved crit_' + wt + '.png');
  }

  // death shatter
  await page.evaluate(() => {
    const b = game.battleScene;
    b.effects = [{ type: 'shatter', side: 'def', duration: 700, timer: 700 * 0.45 }];
  });
  await sleep(170);
  await page.screenshot({ path: `${SHOT}/death_shatter.png`, clip: { x: 55, y: 150, width: 800, height: 310 } });
  console.log('saved death_shatter.png');

  // victory pose (winner raises weapon while loser fades/falls)
  await page.evaluate(() => {
    const b = game.battleScene;
    b.phase = 'result'; b.timer = 320; b.defenderDead = true; b.attackerDead = false; b.deathAlpha = 0.4; b.deathFall = 16;
    b.effects = [
      { type: 'defeat', x: 0, y: 0, text: '撃破！', color: '#ff4444', duration: 1200, timer: 300 },
      { type: 'shatter', side: 'def', duration: 700, timer: 360 },
    ];
  });
  await sleep(170);
  await page.screenshot({ path: `${SHOT}/victory.png` });
  console.log('saved victory.png');
  await browser.close();
})();

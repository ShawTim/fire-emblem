// Capture the animated level-up panel mid-reveal and near-complete.
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/levelup';
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
    const u = game.units.find(x => x.name === '艾琳') || game.units[0];
    u.level += 1; u.maxHp += 1; u.str += 1; u.spd += 2; u.def += 1; u.lck += 1;
    UI.showLevelUp(u, { hp: 1, str: 1, spd: 2, def: 1, lck: 1 }, () => {});
  });
  await sleep(750);
  await page.screenshot({ path: `${SHOT}/lvup_mid.png` });
  console.log('saved lvup_mid.png');
  await sleep(1700);
  await page.screenshot({ path: `${SHOT}/lvup_done.png` });
  console.log('saved lvup_done.png');
  await browser.close();
})();

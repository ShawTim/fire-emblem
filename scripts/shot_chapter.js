// Screenshot a chapter's full map fitted into the canvas.
//   node scripts/shot_chapter.js <id> [port]
const { chromium } = require('playwright');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ID = parseInt(process.argv[2] ?? '2');
const PORT = parseInt(process.argv[3] ?? '8081');
const SHOT = '/tmp/ch_shots';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 820 } });
  page.on('pageerror', e => console.log('[ERR]', e.message));
  await page.goto(`http://localhost:${PORT}/?ch=${ID}`);
  await page.waitForFunction(() => typeof game !== 'undefined' && !!game, { timeout: 15000 });
  await page.evaluate(async (id) => {
    const ts = document.getElementById('title-screen'); if (ts) ts.style.display = 'none';
    await game.startChapter(id);
    const c = document.getElementById('chapter-title-card'); if (c) c.classList.add('hidden');
  }, ID);
  await page.waitForFunction((id) => game.chapterData && game.chapterData.id === id, ID, { timeout: 15000 });
  await page.evaluate(() => {
    game.dialogue.lines = []; game.dialogue.active = false; game.dialogue.onComplete = null;
    game.state = 'map'; game.beginPlayerPhase();
  });
  let s = 400;
  while (await page.evaluate(() => game.dialogue.isActive()) && s-- > 0) {
    await page.evaluate(() => game.dialogue.advance()); await sleep(6);
  }
  await page.addStyleTag({ content: '.map-unit,.map-cursor{display:none!important}' });
  await page.evaluate(() => {
    // terrain-only art view: the DOM unit layer doesn't track GameMap.scale, so hide it
    if (typeof UnitLayer !== 'undefined' && UnitLayer.container) UnitLayer.container.style.display = 'none';
    const W = game.canvasW || 800, H = game.canvasH || 600;
    const fit = 0.98 * Math.min(W / (game.chapterData.width * GameMap.tileSize),
                                H / (game.chapterData.height * GameMap.tileSize));
    GameMap.scale = fit; GameMap.camX = 0; GameMap.camY = 0;
  });
  await sleep(500);
  const out = `${SHOT}/ch${ID}_full.png`;
  await page.screenshot({ path: out });
  console.log('saved', out);
  await browser.close();
})();

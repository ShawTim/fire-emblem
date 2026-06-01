// Screenshot the redesigned ch1 (24x18) map — full-fit + a normal-zoom corner.
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/ch1_new';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 820 } });
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

  const info = await page.evaluate(() => ({
    w: game.chapterData.width, h: game.chapterData.height,
    tile: GameMap.tileSize, units: game.units.length,
    players: game.units.filter(u => u.faction === 'player').map(u => u.name + '@' + u.x + ',' + u.y),
    enemies: game.units.filter(u => u.faction === 'enemy').length,
  }));
  console.log('map:', JSON.stringify(info));

  // Fit whole map into the canvas
  await page.evaluate(() => {
    const fit = Math.min(1040 / (game.chapterData.width * GameMap.tileSize),
                         600 / (game.chapterData.height * GameMap.tileSize));
    GameMap.scale = fit; GameMap.camX = 0; GameMap.camY = 0;
  });
  await sleep(500);
  await page.screenshot({ path: `${SHOT}/ch1_full.png` });
  console.log('saved ch1_full.png');

  // Normal zoom, SW player start
  await page.evaluate(() => {
    GameMap.scale = 1;
    const ts = GameMap.tileSize;
    GameMap.camX = 0;
    GameMap.camY = Math.max(0, (game.chapterData.height * ts) - 600);
  });
  await sleep(300);
  await page.screenshot({ path: `${SHOT}/ch1_start.png` });
  console.log('saved ch1_start.png');

  await browser.close();
})();

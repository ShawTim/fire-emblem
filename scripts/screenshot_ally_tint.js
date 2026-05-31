// Screenshot ch10 T4 after allyReinforce fires to verify green tint on allies.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on('pageerror', e => console.log('[ERROR] ' + e.message));

  await page.goto('http://localhost:8081/');
  await page.waitForFunction(() => { try { return typeof game !== 'undefined' && !!game; } catch (e) { return false; } }, { timeout: 15000 });

  // Drive to ch10 T4 with allies spawned and visible on the map.
  // Dismiss the title menu DOM that covers the canvas, then force-load ch10.
  const summary = await page.evaluate(async () => {
    // Hide title screen and any other overlays
    const titleEl = document.getElementById('title-screen');
    if (titleEl) titleEl.style.display = 'none';
    const cardEl = document.getElementById('chapter-title-card');
    if (cardEl) cardEl.style.display = 'none';

    try { for (const k of Object.keys(chapterCache)) delete chapterCache[k]; } catch (e) {}
    await game.startChapter(10);
    // Hide any chapter card that startChapter just popped up
    const cardEl2 = document.getElementById('chapter-title-card');
    if (cardEl2) cardEl2.style.display = 'none';

    // Force into player phase so units/cursor draw
    game.dialogue.queue = []; game.dialogue.active = false;
    game.state = 'map';
    game.phase = 'player';

    // Jump to T4 and fire allyReinforce
    game.turn = 4;
    game.processTurnEvents();
    game.dialogue.queue = []; game.dialogue.active = false;
    game.state = 'map';

    // Pan camera so ally at (2,17) is roughly centered in the 800×600 viewport
    if (typeof GameMap !== 'undefined') {
      const ts = GameMap.tileSize * GameMap.scale;
      GameMap.camX = Math.max(0, 2 * ts - 200);
      GameMap.camY = Math.max(0, 17 * ts - 350);
    }
    return {
      allies: game.units.filter(u => u.isAlly === true).map(u => ({ name: u.name, x: u.x, y: u.y, hp: u.hp })),
      totalPlayers: game.units.filter(u => u.faction === 'player' && u.hp > 0).length,
      state: game.state,
      phase: game.phase,
    };
  });

  // Give the requestAnimationFrame loop a tick to render
  await page.waitForTimeout(800);

  // Check what CSS classes the ally DOM elements have
  const allyClasses = await page.evaluate(() => {
    const allies = Array.from(document.querySelectorAll('.map-unit')).filter(el => el.classList.contains('map-unit--ally'));
    return allies.map(el => ({
      classes: el.className,
      style: el.getAttribute('style') ? el.getAttribute('style').slice(0, 100) : null,
    }));
  });

  console.log(JSON.stringify({ summary, allyClasses }, null, 2));

  await page.screenshot({ path: '/tmp/ch10_t4_allies.png', fullPage: false });
  console.log('Screenshot: /tmp/ch10_t4_allies.png');
  await browser.close();
})();

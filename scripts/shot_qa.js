// Final QA sweep: for every chapter, screenshot the fitted map + a frozen
// mid-swing battle (new animations + terrain background).
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/qa';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 820 } });
  page.on('pageerror', e => console.log('[ERR]', e.message));
  await page.goto('http://localhost:8081/?ch=2');
  await page.waitForFunction(() => typeof game !== 'undefined' && !!game, { timeout: 15000 });
  await page.addStyleTag({ content: '.map-unit,.map-cursor{display:none!important}' });

  for (let id = 0; id <= 10; id++) {
    await page.evaluate(async (i) => {
      const ts = document.getElementById('title-screen'); if (ts) ts.style.display = 'none';
      await game.startChapter(i);
      const c = document.getElementById('chapter-title-card'); if (c) c.classList.add('hidden');
    }, id);
    await page.waitForFunction((i) => game.chapterData && game.chapterData.id === i, id, { timeout: 15000 });
    await page.evaluate(() => { game.dialogue.lines = []; game.dialogue.active = false; game.dialogue.onComplete = null; game.state = 'map'; game.beginPlayerPhase(); });
    let s = 400; while (await page.evaluate(() => game.dialogue.isActive()) && s-- > 0) { await page.evaluate(() => game.dialogue.advance()); await sleep(6); }
    // clear any leftover frozen battle scene from the previous iteration
    await page.evaluate(() => { const b = game.battleScene; if (b) { delete b.update; b.active = false; b.phase = 'idle'; } game.state = 'map'; });

    // --- map (terrain-only, fitted) ---
    await page.evaluate(() => {
      if (typeof UnitLayer !== 'undefined' && UnitLayer.container) UnitLayer.container.style.display = 'none';
      const W = game.canvasW || 800, H = game.canvasH || 600;
      const fit = 0.98 * Math.min(W / (game.chapterData.width * GameMap.tileSize), H / (game.chapterData.height * GameMap.tileSize));
      GameMap.scale = fit; GameMap.camX = 0; GameMap.camY = 0;
    });
    await sleep(380);
    await page.screenshot({ path: `${SHOT}/ch${id}_map.png` });

    // --- battle (frozen mid-swing) ---
    const ok = await page.evaluate(() => {
      const a = game.units.find(u => u.faction === 'player' && u.hp > 0);
      const t = game.units.find(u => u.faction === 'enemy' && u.hp > 0);
      if (!a || !t) return false;
      a.x = t.x; a.y = t.y - 1; game.startCombat(a, t); return true;
    });
    if (ok) {
      await page.waitForFunction(() => game.battleScene && game.battleScene.isActive(), { timeout: 8000 }).catch(() => {});
      await page.evaluate(() => {
        const b = game.battleScene;
        b.update = function () {}; b.fadeAlpha = 0; b.vsAlpha = 0; b.panelAlpha = 1;
        b.attackerSlide = 0; b.defenderSlide = 0; b.deathAlpha = 1; b.attackerDead = false; b.defenderDead = false; b.critZoom = 0; b.shakeX = 0; b.shakeY = 0;
        b.combatSteps = [{ actor: b.attacker, target: b.defender, hit: true, crit: false, damage: 8, killed: false }];
        b.phase = 'atk1'; b.phaseDuration = 1100; b.stepIndex = 1; b.hitTriggered = false; b.hitDisplayShown = true; b.timer = 0.42 * 1100;
        b._upStrike(0.42);
        b.effects = b.effects.filter(e => e.type !== 'flash');
        b.effects.forEach(e => { if (e.type === 'sparks') e.timer = e.duration * 0.4; if (e.type === 'slash') e.timer = e.duration * 0.3; if (e.type === 'spellFx') e.timer = e.duration * 0.4; });
      });
      await sleep(200);
      await page.screenshot({ path: `${SHOT}/ch${id}_battle.png` });
    }
    console.log('ch' + id + (ok ? ' map+battle' : ' map (no battle)'));
  }
  await browser.close();
})();

// Capture the weapon-swing animation frames by freezing a battle mid-strike.
const { chromium } = require('playwright');
const fs = require('fs');
const SHOT = '/tmp/battle_swing';
if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const FRAMES = [
  { label: '1_windup', phase: 'atk1', step: 1, t: 0.18 },
  { label: '2_swing', phase: 'atk1', step: 1, t: 0.34 },
  { label: '3_connect', phase: 'atk1', step: 1, t: 0.43 },
  { label: '4_follow', phase: 'atk1', step: 1, t: 0.62 },
  { label: '5_def_connect', phase: 'def1', step: 2, t: 0.43 },
];

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

  // Attacker with a SWORD for a clear arc (else fall back to Marcus).
  await page.evaluate(() => {
    const sword = game.units.find(u => u.faction === 'player' && (u.getEquippedWeapon() || {}).type === 'sword');
    const atk = sword || game.units.find(u => u.name === '馬庫斯');
    const tgt = game.units.find(u => u.faction === 'enemy' && u.hp > 0);
    atk.x = tgt.x; atk.y = tgt.y - 1; game.startCombat(atk, tgt);
  });
  await page.waitForFunction(() => game.battleScene && game.battleScene.isActive(), { timeout: 8000 });

  await page.evaluate(() => {
    const b = game.battleScene;
    b.update = function () {};
    b.fadeAlpha = 0; b.vsAlpha = 0; b.panelAlpha = 1; b.critZoom = 0; b.shakeX = 0; b.shakeY = 0;
    b.attackerSlide = 0; b.defenderSlide = 0; b.deathAlpha = 1; b.attackerDead = false; b.defenderDead = false;
    // deterministic demo strikes: attacker hits, then defender counters
    b.combatSteps = [
      { actor: b.attacker, target: b.defender, hit: true, crit: false, damage: 9, killed: false },
      { actor: b.defender, target: b.attacker, hit: true, crit: false, damage: 6, killed: false },
    ];
  });

  for (const f of FRAMES) {
    await page.evaluate((fr) => {
      const b = game.battleScene;
      b.effects = []; b.hitTriggered = false; b.hitDisplayShown = true;
      b.attackerFlash = 0; b.defenderFlash = 0;
      b.phase = fr.phase; b.phaseDuration = 1100; b.stepIndex = fr.step;
      b.timer = fr.t * b.phaseDuration;
      b._upStrike(fr.t);
      b.effects = b.effects.filter(e => e.type !== 'flash'); // keep slash/sparks/damage, drop full-screen flash for the still
      b.effects.forEach(e => { if (e.type === 'sparks') e.timer = e.duration * 0.42; if (e.type === 'slash') e.timer = e.duration * 0.3; });
    }, f);
    await sleep(160);
    await page.screenshot({ path: `${SHOT}/swing_${f.label}.png`, clip: { x: 55, y: 150, width: 800, height: 310 } });
    console.log('saved swing_' + f.label + '.png');
  }

  // ---- ranged pass: a bow user fires a projectile instead of lunging ----
  await page.evaluate(() => {
    const atk = game.units.find(u => u.faction === 'player' && (u.getEquippedWeapon() || {}).type === 'bow') || game.units.find(u => u.name === '莉娜');
    const tgt = game.units.find(u => u.faction === 'enemy' && u.hp > 0);
    atk.x = tgt.x; atk.y = tgt.y - 1; game.startCombat(atk, tgt);
  });
  await page.waitForFunction(() => game.battleScene && game.battleScene.isActive(), { timeout: 8000 });
  await page.evaluate(() => {
    const b = game.battleScene;
    b.update = function () {}; b.fadeAlpha = 0; b.vsAlpha = 0; b.panelAlpha = 1;
    b.attackerSlide = 0; b.defenderSlide = 0; b.deathAlpha = 1; b.attackerDead = false; b.defenderDead = false;
    b.combatSteps = [{ actor: b.attacker, target: b.defender, hit: true, crit: false, damage: 7, killed: false }];
  });
  for (const rf of [{ label: 'r1_flight', t: 0.34 }, { label: 'r2_connect', t: 0.46 }]) {
    await page.evaluate((fr) => {
      const b = game.battleScene;
      b.effects = []; b.hitTriggered = false; b.hitDisplayShown = true; b.attackerFlash = 0; b.defenderFlash = 0;
      b.phase = 'atk1'; b.phaseDuration = 1100; b.stepIndex = 1; b.timer = fr.t * b.phaseDuration;
      b._upStrike(fr.t);
      b.effects = b.effects.filter(e => e.type !== 'flash');
      b.effects.forEach(e => { if (e.type === 'sparks') e.timer = e.duration * 0.42; });
    }, rf);
    await sleep(160);
    await page.screenshot({ path: `${SHOT}/swing_${rf.label}.png`, clip: { x: 55, y: 150, width: 800, height: 310 } });
    console.log('saved swing_' + rf.label + '.png');
  }
  await browser.close();
})();

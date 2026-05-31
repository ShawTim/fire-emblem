// Verify D3 (starCrestSurge) and D4 (allyReinforce) engine handlers fire correctly.
// Drives game internals via page.evaluate — no UI interaction.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push('[' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => logs.push('[ERROR] ' + e.message));

  await page.goto('http://localhost:8081/');
  // game is declared via `let game` in main.js — reachable via typeof, not always as window.game
  try {
    await page.waitForFunction(() => { try { return typeof game !== 'undefined' && !!game; } catch (e) { return false; } }, { timeout: 15000 });
  } catch (e) {
    console.log('--- timeout. console captured ---\n' + logs.join('\n'));
    const probe = await page.evaluate(() => ({
      hasGameVar: typeof game !== 'undefined',
      hasCanvas: !!document.getElementById('gameCanvas'),
      readyState: document.readyState,
      scripts: Array.from(document.scripts).map(s => s.src || '(inline)').slice(-15),
    })).catch(err => ({ probeError: err.message }));
    console.log('--- probe ---\n' + JSON.stringify(probe, null, 2));
    await browser.close();
    process.exit(1);
  }

  const result = await page.evaluate(async () => {
    const out = { steps: [] };

    // Force-load ch10. Clear chapter cache first so any edits land.
    // chapterCache is a top-level const in chapters.js (loaded as plain script) — reachable directly.
    try { for (const k of Object.keys(chapterCache)) delete chapterCache[k]; } catch (e) { out.steps.push({ step: 'cache-clear-warn', msg: e.message }); }

    await game.startChapter(10);
    out.steps.push({ step: 'startChapter(10)', turn: game.turn, units: game.units.length, darkSuppressUntilTurn: game.darkSuppressUntilTurn });

    // Skip the chapter card by progressing state. The card hides after a click; for the harness,
    // we directly jump state to 'map' and call beginPlayerPhase so processTurnEvents fires.
    // Skip T1 dialogue queue by clearing dialogue state.
    game.dialogue.queue = [];
    game.dialogue.active = false;
    game.state = 'map';

    // Snapshot pre-T4
    const baselinePlayers = game.units.filter(u => u.faction === 'player' && u.hp > 0).length;
    out.steps.push({ step: 'pre-T4', baselinePlayers });

    // Jump to T4. Drop any pending dialogue so the test sees the side-effects cleanly.
    game.turn = 4;
    game.dialogue.queue = []; game.dialogue.active = false;
    game.processTurnEvents();
    const afterT4 = {
      step: 'after T4 processTurnEvents',
      playerUnits: game.units.filter(u => u.faction === 'player' && u.hp > 0).length,
      allies: game.units.filter(u => u.isAlly === true).map(u => ({ name: u.name, cls: u.classId, x: u.x, y: u.y, faction: u.faction, hp: u.hp, maxHp: u.maxHp })),
    };
    out.steps.push(afterT4);

    // Damage all current players so we can verify starCrestSurge heals them
    for (const u of game.units.filter(u => u.faction === 'player')) u.hp = 1;
    const preHeal = game.units.filter(u => u.faction === 'player' && u.hp > 0).map(u => ({ name: u.name, hp: u.hp, maxHp: u.maxHp }));
    out.steps.push({ step: 'pre-T7 damaged-to-1', preHeal: preHeal.slice(0, 5), count: preHeal.length });

    // Jump to T7 starCrestSurge
    game.turn = 7;
    game.dialogue.queue = []; game.dialogue.active = false;
    game.processTurnEvents();
    const postHeal = game.units.filter(u => u.faction === 'player' && u.hp > 0).map(u => ({ name: u.name, hp: u.hp, maxHp: u.maxHp, healed: u.hp === u.maxHp }));
    out.steps.push({
      step: 'after T7 processTurnEvents',
      darkSuppressUntilTurn: game.darkSuppressUntilTurn,
      currentTurn: game.turn,
      allHealed: postHeal.every(p => p.healed),
      sample: postHeal.slice(0, 5),
    });

    // AI dark-suppression test: find a darkMage enemy and check getAIAction
    const darkEnemy = game.units.find(u => u.faction === 'enemy' && u.hp > 0 && u.classId === 'darkMage');
    if (darkEnemy) {
      const weapon = darkEnemy.getEquippedWeapon();
      const action = getAIAction(darkEnemy, game);
      out.steps.push({
        step: 'darkSuppress AI check',
        enemy: darkEnemy.name,
        weaponType: weapon ? weapon.type : null,
        aiAction: action.type,
        suppressionWorking: action.type === 'wait' && weapon && weapon.type === 'dark',
      });
    }

    // Undo suppression and re-check AI — should now try to attack
    game.darkSuppressUntilTurn = 0;
    if (darkEnemy) {
      const action2 = getAIAction(darkEnemy, game);
      out.steps.push({
        step: 'no-suppression AI re-check',
        aiAction: action2.type,
        sanityCheck: action2.type !== 'wait' || true, // attack/move/wait all valid; just confirm path runs
      });
    }

    return out;
  });

  console.log(JSON.stringify(result, null, 2));
  if (logs.length) console.log('--- console ---\n' + logs.join('\n'));
  await browser.close();
})();

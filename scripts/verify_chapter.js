// Reusable headless chapter verifier.
//   node scripts/verify_chapter.js <chapterId> [port]
// Reports: map size, unit-placement passability, seize/village tile validity,
// T1 enemy threat ranges per player unit (exact dmg/hit/double via calculateCombat),
// and a live do-nothing T1 enemy-phase run to detect deaths / HP loss (wipe check).
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ID   = parseInt(process.argv[2] ?? '2');
const PORT = parseInt(process.argv[3] ?? '8081');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 820 } });
  page.on('pageerror', e => console.log('[ERR]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('[cerr]', m.text()); });

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

  const rpt = await page.evaluate(() => {
    const W = GameMap.width, H = GameMap.height, T = GameMap.terrain, O = GameMap.objects;
    const mcost = (x, y, u) => getMovementCost(T[y][x], u, O ? O[y][x] : null);
    const alive = game.units.filter(u => u.hp > 0);
    const players = alive.filter(u => u.faction === 'player');
    const enemies = alive.filter(u => u.faction === 'enemy');

    // units sitting on impassable tiles (per their own movement profile)
    const onBad = alive.filter(u => mcost(u.x, u.y, u) >= 999)
      .map(u => `${u.name}@${u.x},${u.y}=${T[u.y][u.x]}/${O[u.y][u.x] || ''}`);

    // enemy threat: who can reach+hit each player unit on EP, with exact forecast
    const threat = {};
    players.forEach(p => { threat[`${p.name}@${p.x},${p.y}`] = { hp: p.hp, byEnemies: [], sumDmg: 0, lethal: false, isLord: !!p.isLord }; });
    enemies.forEach(e => {
      const mr = getMovementRange(e, T, game.units, W, H);
      const atSet = new Set(getAttackTilesFromPositions(mr, e, W, H).map(t => `${t.x},${t.y}`));
      players.forEach(p => {
        if (!atSet.has(`${p.x},${p.y}`)) return;
        const fc = calculateCombat(e, p, GameMap);
        if (!fc) return;
        const hits = fc.attacker.doubleAttack ? 2 : 1;
        const dmg = fc.attacker.damage * hits;
        const rec = threat[`${p.name}@${p.x},${p.y}`];
        rec.byEnemies.push(`${e.name}(${e.classId}) ${fc.attacker.damage}x${hits} @${fc.attacker.hit}%`);
        rec.sumDmg += dmg;
      });
    });
    Object.values(threat).forEach(r => { r.lethal = r.sumDmg >= r.hp; });

    // seize tile
    let seize = null;
    if (game.chapterData.seizePos) {
      const { x, y } = game.chapterData.seizePos;
      seize = { x, y, terrain: T[y][x], obj: O[y][x], standable: (TERRAIN_DATA[T[y][x]] ? TERRAIN_DATA[T[y][x]].cost : 1) < 999 || !!O[y][x] };
    }
    // village tiles must carry a 'village' object
    const villageBad = (game.chapterData.villageEvents || [])
      .filter(v => !(O[v.y] && O[v.y][v.x] === 'village'))
      .map(v => `${v.x},${v.y}=${T[v.y][v.x]}/${O[v.y] ? O[v.y][v.x] : ''}`);

    return {
      size: `${W}x${H}`, nPlayers: players.length, nEnemies: enemies.length,
      players: players.map(p => `${p.name}(${p.classId}) @${p.x},${p.y} hp${p.hp}/${p.maxHp} mov${p.mov}`),
      onBad, seize, villageBad,
      threatened: Object.entries(threat).filter(([, r]) => r.byEnemies.length)
        .map(([k, r]) => `${r.lethal ? '☠LETHAL ' : ''}${r.isLord ? '👑 ' : ''}${k}: ${r.sumDmg}/${r.hp} dmg from [${r.byEnemies.join(', ')}]`),
    };
  });
  console.log(`\n===== CH${ID} STATIC =====`);
  console.log(JSON.stringify(rpt, null, 2));

  // Live do-nothing T1 enemy phase (ground-truth wipe check)
  const before = await page.evaluate(() => game.units.filter(u => u.faction === 'player' && u.hp > 0).map(u => ({ n: u.name, hp: u.hp })));
  await page.evaluate(() => { if (game.state === 'map' && game.phase === 'player') game.endTurn(); });
  await page.waitForFunction(() => (game.phase === 'player' && game.turn >= 2) || game.state === 'gameOver', { timeout: 90000 }).catch(() => {});
  const after = await page.evaluate(() => ({
    state: game.state, turn: game.turn, phase: game.phase,
    players: game.units.filter(u => u.faction === 'player').map(u => ({ n: u.name, hp: u.hp, max: u.maxHp })),
  }));
  const beforeMap = Object.fromEntries(before.map(b => [b.n, b.hp]));
  const deltas = after.players.map(p => {
    const b = beforeMap[p.n];
    const dead = p.hp <= 0;
    const lost = (b ?? p.max) - p.hp;
    return `${p.n}: ${b ?? '?'}→${p.hp}${dead ? ' ☠DEAD' : (lost > 0 ? ` (-${lost})` : '')}`;
  });
  console.log(`\n===== CH${ID} LIVE T1-EP (do nothing) =====`);
  console.log(`end state=${after.state} turn=${after.turn} phase=${after.phase}`);
  console.log(deltas.join('\n'));
  console.log(after.state === 'gameOver' ? '❌ WIPE / game over on T1' : '✅ survived T1 enemy phase');

  await browser.close();
})();

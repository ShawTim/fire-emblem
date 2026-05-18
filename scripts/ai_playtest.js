#!/usr/bin/env node
/**
 * ai_playtest.js
 * Claude plays the game by taking canvas screenshots and deciding where to click.
 *
 * Prerequisites (one-time):
 *   npx playwright install chromium
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   npm start   (keep running in another terminal)
 *
 * Usage:
 *   node scripts/ai_playtest.js [chapter] [port]
 *   node scripts/ai_playtest.js 1        # ch1 wilderness, port 8080
 *   node scripts/ai_playtest.js 3 8081   # ch3 castle, port 8081
 *
 * Output:
 *   playtest_logs/session_<timestamp>.md  — full action log with reasoning
 */

const { chromium } = require('playwright');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const CHAPTER = parseInt(process.argv[2] ?? '1');
const PORT    = parseInt(process.argv[3] ?? '8080');
const MODEL   = 'claude-sonnet-4-6';
const MAX_ACTIONS = 250;
const ACTION_DELAY_MS = 700;   // wait after each click
const ENEMY_WAIT_MS   = 2500;  // wait during enemy phase

const LOG_DIR = path.join(__dirname, '..', 'playtest_logs');
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ---------------------------------------------------------------------------
// System prompt — sent with every screenshot
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `\
You are an expert Fire Emblem SRPG player. You see screenshots of a game canvas \
(800×600 pixels) and decide the next action.

MECHANICS:
- Turn-based strategy. Blue units = player, Red units = enemy.
- Player phase: click a blue unit → click a destination tile → click Attack or Wait.
- Weapon triangle: Sword > Axe > Lance > Sword. Fire > Wind > Thunder > Fire.
- Terrain bonuses: forest (+1 def, +20 avo), gate/throne (+3 def, +30 avo, heals each turn).
- Eirine (the Lord / crown icon) must survive — her death = game over.
- Objective shown in top bar: rout / seize / boss.

GAME STATE (injected from JS — may be null if loading):
{STATE}

CURRENT PHASE GUIDE:
- "player" phase: act with all blue units that have not yet moved (acted=false).
- "enemy" phase: do nothing; the game runs enemy AI automatically. Output a wait action.
- Dialogue / prologue: click anywhere on canvas to advance text.
- Action menu visible (Attack / Wait / Items): click the relevant option.
- Chapter clear / game over screen: click center of canvas.

RESPOND in exactly this format (no other text):
<reasoning>
Concise tactical reasoning — which unit, why, what the goal is. Max 3 sentences.
</reasoning>
<action>
{"type":"click","x":NUMBER,"y":NUMBER}
</action>

OR if it is the enemy phase or an animation is playing:
<action>
{"type":"wait","ms":2500}
</action>

Coordinates are canvas-relative pixels (0–799 x, 0–599 y).`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read game internals from the browser page. Returns {} on failure. */
async function getGameState(page) {
  try {
    return await page.evaluate(() => {
      if (typeof game === 'undefined' || !game) return { status: 'loading' };
      const units = game.units || [];
      return {
        status:     'ok',
        phase:      game.phase,
        state:      game.state,
        turn:       game.turn,
        objective:  game.chapterData?.objective,
        subtitle:   game.chapterData?.subtitle,
        playerUnits: units
          .filter(u => u.faction === 'player' && u.hp > 0)
          .map(u => ({ name: u.name, cls: u.classId, hp: u.hp, maxHp: u.maxHp,
                       x: u.x, y: u.y, acted: u.acted, isLord: u.isLord })),
        enemyCount: units.filter(u => u.faction === 'enemy' && u.hp > 0).length,
      };
    });
  } catch {
    return { status: 'error' };
  }
}

function parseTag(text, tag) {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : null;
}

function parseAction(text) {
  const raw = parseTag(text, 'action');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Simple hash: compare 200-char slice of base64 to detect identical frames */
function quickHash(b64) { return b64.slice(200, 400); }

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(LOG_DIR, `session_${ts}.md`);
  const logLines = [];

  function log(md) {
    logLines.push(md);
    fs.writeFileSync(logPath, logLines.join('\n\n'));
  }

  log(`# AI Playtest — Chapter ${CHAPTER}\n**Date:** ${new Date().toISOString()}  \n**Model:** ${MODEL}`);
  console.log(`▶  Chapter ${CHAPTER}  |  port ${PORT}  |  model ${MODEL}`);
  console.log(`   Log → ${logPath}\n`);

  const browser = await chromium.launch({ headless: false });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(`http://localhost:${PORT}/?chapter=${CHAPTER}`);
  await page.waitForTimeout(4000); // let preloadChapters() resolve

  const canvas = page.locator('#gameCanvas');

  let actionCount       = 0;
  let stuckCount        = 0;
  let lastHash          = '';
  const actionLog       = []; // for final feedback summary

  while (actionCount < MAX_ACTIONS) {
    // ── 1. Read game state ──────────────────────────────────────────────────
    const gs = await getGameState(page);

    // Detect chapter end (no enemies left on a rout map, or game went to title)
    if (gs.status === 'ok' && gs.objective === 'rout' && gs.enemyCount === 0) {
      console.log('\n✅ All enemies defeated — chapter may be complete.');
      // Give Claude one more look to handle the clear screen
    }

    // ── 2. Screenshot (canvas element only → always 800×600) ───────────────
    const buf    = await canvas.screenshot();
    const b64    = buf.toString('base64');
    const hash   = quickHash(b64);

    if (hash === lastHash) {
      stuckCount++;
      if (stuckCount >= 6) {
        console.log('⚠  Same frame 6×  — pressing Escape to unstick');
        await page.keyboard.press('Escape');
        stuckCount = 0;
        await page.waitForTimeout(600);
        continue;
      }
    } else {
      stuckCount = 0;
      lastHash   = hash;
    }

    // ── 3. Ask Claude ───────────────────────────────────────────────────────
    const stateStr = JSON.stringify(gs, null, 2);
    const sysPrompt = SYSTEM_PROMPT.replace('{STATE}', stateStr);

    let response;
    try {
      response = await anthropic.messages.create({
        model:      MODEL,
        max_tokens: 350,
        system:     sysPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } },
            { type: 'text',  text: `Action #${actionCount + 1}. Turn: ${gs.turn ?? '?'}, Phase: ${gs.phase ?? '?'}, Enemies left: ${gs.enemyCount ?? '?'}. What next?` },
          ],
        }],
      });
    } catch (err) {
      console.error('  API error:', err.message);
      await page.waitForTimeout(2000);
      continue;
    }

    const reply     = response.content[0].text;
    const reasoning = parseTag(reply, 'reasoning') ?? '(no reasoning)';
    const action    = parseAction(reply);

    // ── 4. Log & print ──────────────────────────────────────────────────────
    const label = `Action ${actionCount + 1} | T${gs.turn ?? '?'} ${gs.phase ?? '?'}`;
    console.log(`\n[${label}]`);
    console.log(`  💭 ${reasoning.replace(/\n/g, ' ')}`);
    console.log(`  🖱  ${JSON.stringify(action)}`);

    log([
      `## ${label}`,
      `**State:** phase=${gs.phase} turn=${gs.turn} enemies=${gs.enemyCount}`,
      `**Reasoning:** ${reasoning}`,
      `**Action:** \`${JSON.stringify(action)}\``,
    ].join('  \n'));

    actionLog.push({ turn: gs.turn, phase: gs.phase, reasoning, action });

    // ── 5. Execute ──────────────────────────────────────────────────────────
    if (!action) {
      await page.waitForTimeout(1000);
    } else if (action.type === 'wait') {
      await page.waitForTimeout(action.ms ?? ENEMY_WAIT_MS);
    } else if (action.type === 'click') {
      const x = Math.max(0, Math.min(799, action.x));
      const y = Math.max(0, Math.min(599, action.y));
      await canvas.click({ position: { x, y } });
      await page.waitForTimeout(
        gs.phase === 'enemy' ? ENEMY_WAIT_MS : ACTION_DELAY_MS
      );
    }

    actionCount++;
  }

  // ── Final feedback ─────────────────────────────────────────────────────────
  console.log('\n⏹  Session complete — generating feedback report…');
  const finalState = await getGameState(page);

  const feedbackPrompt = `\
You just played ${actionCount} actions of a Fire Emblem chapter.
Final state: turn ${finalState.turn}, phase "${finalState.phase}", \
${finalState.enemyCount ?? '?'} enemies remaining, \
${finalState.playerUnits?.filter(u => u.hp > 0).length ?? '?'} player units alive.

Here is the action log (reasoning + actions taken):
${actionLog.slice(-40).map((a, i) => `${i + 1}. [T${a.turn} ${a.phase}] ${a.reasoning}`).join('\n')}

Write a concise feedback report covering:
1. Overall performance (chapter cleared? casualties?)
2. Strongest tactical decisions made
3. Mistakes or missed opportunities
4. Specific improvements for next playthrough`;

  let feedback = '(feedback generation failed)';
  try {
    const fb = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: feedbackPrompt }],
    });
    feedback = fb.content[0].text;
  } catch (err) {
    console.error('Feedback error:', err.message);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(feedback);
  console.log('─'.repeat(60));

  log(`## Feedback Report\n\n${feedback}`);
  log(`---\n*Session ended after ${actionCount} actions.*`);

  console.log(`\n📄 Full log: ${logPath}`);
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

// ai.js — Enemy AI

function executeEnemyPhase(game) {
  const actions = [];
  const enemies = game.units.filter(u => u.faction === 'enemy' && u.hp > 0 && !u.acted);
  for (const unit of enemies) {
    const action = getAIAction(unit, game);
    if (action) actions.push(action);
    // Don't set unit.acted here - it will be set after the action is executed
  }
  return actions;
}

function getAIAction(unit, game) {
  const ai = unit.ai || 'aggressive';
  const wpn = unit.getEquippedWeapon();
  if (!wpn || wpn.type === 'staff') return { unit, type: 'wait' };

  const targets = game.units.filter(u => u.faction === 'player' && u.hp > 0);
  if (targets.length === 0) return { unit, type: 'wait' };

  const atkRange = unit.getAttackRange();

  if (ai === 'boss' || ai === 'defensive') {
    // Stay put, attack if in range
    const inRange = targets.filter(t => {
      const dist = Math.abs(unit.x - t.x) + Math.abs(unit.y - t.y);
      return atkRange.includes(dist);
    });
    if (inRange.length > 0) {
      const target = pickBestTarget(unit, inRange, game);
      return { unit, type: 'attack', target, moveX: unit.x, moveY: unit.y };
    }
    if (ai === 'boss') return { unit, type: 'wait' };
    // Defensive: don't move
    return { unit, type: 'wait' };
  }

  // Aggressive: move toward best target and attack
  const moveRange = getMovementRange(unit, GameMap.terrain, game.units, GameMap.width, GameMap.height);

  let bestAction = null;
  let bestScore = -Infinity;

  for (const pos of moveRange) {
    for (const r of atkRange) {
      for (const [dx, dy] of getAllTilesAtRange(r)) {
        const tx = pos.x + dx, ty = pos.y + dy;
        if (tx < 0 || ty < 0 || tx >= GameMap.width || ty >= GameMap.height) continue;
        const target = targets.find(t => t.x === tx && t.y === ty);
        if (!target) continue;

        // Temporarily move unit to evaluate
        const origX = unit.x, origY = unit.y;
        unit.x = pos.x; unit.y = pos.y;
        const forecast = calculateCombat(unit, target, GameMap);
        unit.x = origX; unit.y = origY;
        if (!forecast) continue;

        let score = forecast.attacker.damage;
        // Can kill bonus
        if (forecast.attacker.damage >= target.hp) score += 100;
        // Low HP target bonus
        score += (1 - target.hp / target.maxHp) * 20;
        // Weapon advantage
        if (forecast.attacker.hit > 70) score += 10;
        // Avoid dying
        if (forecast.defender.canCounter && forecast.defender.damage >= unit.hp) score -= 200;
        // Prioritize lord
        if (target.isLord) score += 15;

        if (score > bestScore) {
          bestScore = score;
          bestAction = { unit, type: 'attack', target, moveX: pos.x, moveY: pos.y };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // No attack possible: move toward nearest target
  if (targets.length > 0) {
    let nearest = targets[0], nearestDist = Infinity;
    for (const t of targets) {
      const d = Math.abs(unit.x - t.x) + Math.abs(unit.y - t.y);
      if (d < nearestDist) { nearestDist = d; nearest = t; }
    }
    // Pick move position closest to nearest target
    let bestPos = { x: unit.x, y: unit.y }, bestDist = nearestDist;
    for (const pos of moveRange) {
      const d = Math.abs(pos.x - nearest.x) + Math.abs(pos.y - nearest.y);
      if (d < bestDist) { bestDist = d; bestPos = pos; }
    }
    if (bestPos.x !== unit.x || bestPos.y !== unit.y) {
      return { unit, type: 'move', moveX: bestPos.x, moveY: bestPos.y };
    }
  }

  return { unit, type: 'wait' };
}

function pickBestTarget(unit, targets, game) {
  let best = targets[0], bestScore = -Infinity;
  for (const t of targets) {
    const forecast = calculateCombat(unit, t, GameMap);
    if (!forecast) continue;
    let score = forecast.attacker.damage;
    if (forecast.attacker.damage >= t.hp) score += 100;
    score += (1 - t.hp / t.maxHp) * 20;
    if (t.isLord) score += 15;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}

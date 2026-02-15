// combat.js — Combat calculation and execution

function calculateCombat(attacker, defender, map) {
  const atkWpn = attacker.getEquippedWeapon();
  const defWpn = defender.getEquippedWeapon();
  if (!atkWpn) return null;

  const atkTerrain = map.getTerrain(attacker.x, attacker.y);
  const defTerrain = map.getTerrain(defender.x, defender.y);
  const dist = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);

  // Weapon triangle
  const triBonus = defWpn ? getTriangleBonus(atkWpn.type, defWpn.type) : { hit: 0, atk: 0 };
  const triBonusDef = defWpn ? getTriangleBonus(defWpn.type, atkWpn.type) : { hit: 0, atk: 0 };

  // Attacker stats
  const atkPow = (atkWpn.magic ? attacker.mag : attacker.str) + atkWpn.atk + triBonus.atk;
  const defStat = defender.getDefAt(defTerrain, atkWpn.magic);
  const atkDmg = Math.max(0, atkPow - defStat);
  const atkHit = Math.max(0, Math.min(100, attacker.getHit() + triBonus.hit - defender.getAvo(defTerrain)));
  const atkCrit = Math.max(0, attacker.getCrit() - defender.lck);
  const atkDouble = attacker.spd - defender.spd >= 5;

  // Effective bonus
  let atkEffMult = 1;
  if (atkWpn.effective && atkWpn.effective.length > 0) {
    const defCls = getClassData(defender.classId);
    const defTags = defCls.tags || [];
    if (atkWpn.effective.some(t => defTags.includes(t))) atkEffMult = 3;
  }

  // Defender counter
  let canCounter = false;
  let defDmg = 0, defHit = 0, defCrit = 0, defDouble = false;
  if (defWpn && defWpn.type !== 'staff' && defWpn.range.includes(dist)) {
    canCounter = true;
    const defPow = (defWpn.magic ? defender.mag : defender.str) + defWpn.atk + triBonusDef.atk;
    const atkDefStat = attacker.getDefAt(atkTerrain, defWpn.magic);
    defDmg = Math.max(0, defPow - atkDefStat);
    defHit = Math.max(0, Math.min(100, defender.getHit() + triBonusDef.hit - attacker.getAvo(atkTerrain)));
    defCrit = Math.max(0, defender.getCrit() - attacker.lck);
    defDouble = defender.spd - attacker.spd >= 5;

    // Effective for defender
    if (defWpn.effective && defWpn.effective.length > 0) {
      const atkCls = getClassData(attacker.classId);
      const atkTags = atkCls.tags || [];
      if (defWpn.effective.some(t => atkTags.includes(t))) defDmg *= 3;
    }
  }

  return {
    attacker: {
      name: attacker.name, hp: attacker.hp, maxHp: attacker.maxHp,
      damage: Math.floor(atkDmg * atkEffMult), hit: atkHit, crit: atkCrit, doubleAttack: atkDouble
    },
    defender: {
      name: defender.name, hp: defender.hp, maxHp: defender.maxHp,
      damage: defDmg, hit: defHit, crit: defCrit, doubleAttack: defDouble, canCounter
    }
  };
}

function executeCombat(attacker, defender, map) {
  const forecast = calculateCombat(attacker, defender, map);
  if (!forecast) return { steps: [], exp: 0 };

  const steps = [];
  const atkWpn = attacker.getEquippedWeapon();
  const defWpn = defender.getEquippedWeapon();

  function doAttack(actor, target, fc) {
    const roll = Math.random() * 100;
    if (roll >= fc.hit) {
      steps.push({ actor, target, damage: 0, hit: false, crit: false, killed: false });
      return false;
    }
    const critRoll = Math.random() * 100;
    const isCrit = critRoll < fc.crit;
    const dmg = isCrit ? fc.damage * 3 : fc.damage;
    const killed = target.takeDamage(dmg);

    // Drain weapons
    if (actor === attacker && atkWpn && atkWpn.drain) actor.heal(dmg);
    if (actor === defender && defWpn && defWpn.drain) actor.heal(dmg);

    steps.push({ actor, target, damage: dmg, hit: true, crit: isCrit, killed });
    return killed;
  }

  // Attacker hits
  if (atkWpn) atkWpn.usesLeft = Math.max(0, atkWpn.usesLeft - 1);
  if (doAttack(attacker, defender, forecast.attacker)) {
    return { steps, exp: calculateExp(attacker, defender, true) };
  }

  // Defender counters
  if (forecast.defender.canCounter && defender.hp > 0) {
    if (defWpn) defWpn.usesLeft = Math.max(0, defWpn.usesLeft - 1);
    if (doAttack(defender, attacker, forecast.defender)) {
      return { steps, exp: 0 };
    }
  }

  // Attacker doubles
  if (forecast.attacker.doubleAttack && defender.hp > 0) {
    if (doAttack(attacker, defender, forecast.attacker)) {
      return { steps, exp: calculateExp(attacker, defender, true) };
    }
  }

  // Defender doubles
  if (forecast.defender.canCounter && forecast.defender.doubleAttack && attacker.hp > 0 && defender.hp > 0) {
    if (doAttack(defender, attacker, forecast.defender)) {
      return { steps, exp: 0 };
    }
  }

  return { steps, exp: calculateExp(attacker, defender, false) };
}

function calculateExp(attacker, defender, killed) {
  if (attacker.faction !== 'player') return 0;
  // Effective level: promoted units count as level + 20
  const atkEffLevel = attacker.level + (attacker.promoted ? 20 : 0);
  const defEffLevel = defender.level + (defender.promoted ? 20 : 0);
  const levelDiff = defEffLevel - atkEffLevel;

  let exp;
  if (killed) {
    // Kill EXP: base depends on level difference
    exp = Math.max(1, Math.floor((defEffLevel * 10) / atkEffLevel));
    if (levelDiff > 0) exp += levelDiff * 3;
    if (defender.isBoss) exp += 40;
    exp = Math.max(1, Math.min(100, exp));
  } else {
    // Combat EXP (hit but didn't kill)
    exp = Math.max(1, Math.floor(1 + levelDiff));
    if (levelDiff < -5) exp = 1;
  }
  return exp;
}

function executeHeal(healer, target) {
  const staff = healer.getHealStaff();
  if (!staff) return null;
  const healAmt = Math.min(staff.heals + healer.mag, target.maxHp - target.hp);
  target.heal(healAmt);
  staff.usesLeft = Math.max(0, staff.usesLeft - 1);
  // Healer gets some EXP
  const exp = Math.min(100, Math.max(10, 20 + (target.maxHp - target.hp)));
  return { healAmt, exp: Math.min(60, exp) };
}

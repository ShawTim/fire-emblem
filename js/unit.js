// unit.js - Unit class
const TERRAIN_DATA = {
  plain:    { def: 0, avo: 0, cost: 1 },
  forest:   { def: 1, avo: 20, cost: 2 },
  mountain: { def: 2, avo: 30, cost: 3 },
  wall:     { def: 3, avo: 20, cost: 999 },
  gate:     { def: 3, avo: 30, cost: 1 },
  river:    { def: 0, avo: 0, cost: 999 },
  village:  { def: 0, avo: 10, cost: 1 },
  throne:   { def: 3, avo: 30, cost: 1 },
  pillar:   { def: 1, avo: 15, cost: 2 },
};

class Unit {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.charId = data.charId || null;
    this.name = data.name || '???';
    this.classId = data.classId;
    this.level = data.level || 1;
    this.exp = 0;
    this.faction = data.faction || 'player';
    this.x = data.x;
    this.y = data.y;
    this.isLord = data.isLord || false;
    this.isBoss = data.isBoss || false;
    this.isCain = data.isCain || false;
    this.recruitableBy = data.recruitableBy || null;
    this.recruited = false;
    this.ai = data.ai || null;
    this.portrait = data.portrait || null;
    this.growths = data.growths || {};
    this.acted = false;
    this.moved = false;

    // Stats
    const bs = data.baseStats || data.stats || {};
    this.maxHp = bs.hp || 20;
    this.hp = this.maxHp;
    this.str = bs.str || 0;
    this.mag = bs.mag || 0;
    this.skl = bs.skl || 0;
    this.spd = bs.spd || 0;
    this.lck = bs.lck || 0;
    this.def = bs.def || 0;
    this.res = bs.res || 0;

    // Apply bonus stats (for bosses)
    if (data.bonusStats) {
      for (const [k, v] of Object.entries(data.bonusStats)) {
        if (k === 'hp') { this.maxHp += v; this.hp = this.maxHp; }
        else if (this[k] !== undefined) this[k] += v;
      }
    }

    // Items
    this.items = [];
    if (data.items) {
      for (const itemId of data.items) {
        const item = createItem(itemId);
        if (item) this.items.push(item);
      }
    }

    const cls = getClassData(this.classId);
    this.mov = cls.mov || 5;
    const tags = cls.tags || [];
    this.flying = tags.includes('flying');
    this.mounted = tags.includes('mounted');
    this.promoted = cls.promoted || false;
  }

  getEquippedWeapon() {
    const cls = getClassData(this.classId);
    for (const item of this.items) {
      if (item.type === 'consumable' || item.type === 'promotion') continue;
      if (item.usesLeft <= 0) continue;
      if (cls.weapons.includes(item.type) || item.type === 'staff') return item;
    }
    return null;
  }

  getAttackRange() {
    const wpn = this.getEquippedWeapon();
    if (!wpn) return [];
    return wpn.range || [1];
  }

  getAtk() {
    const wpn = this.getEquippedWeapon();
    if (!wpn) return 0;
    if (wpn.magic) return this.mag + wpn.atk;
    return this.str + wpn.atk;
  }

  getHit() {
    const wpn = this.getEquippedWeapon();
    if (!wpn) return 0;
    return this.skl * 2 + this.lck + (wpn.hit || 0);
  }

  getCrit() {
    const wpn = this.getEquippedWeapon();
    return Math.floor(this.skl / 2) + (wpn ? (wpn.crit || 0) : 0);
  }

  getAvo(terrain) {
    const td = TERRAIN_DATA[terrain] || TERRAIN_DATA.plain;
    return this.spd * 2 + this.lck + td.avo;
  }

  getDefAt(terrain, magical) {
    const td = TERRAIN_DATA[terrain] || TERRAIN_DATA.plain;
    return (magical ? this.res : this.def) + td.def;
  }

  canAttack() {
    const wpn = this.getEquippedWeapon();
    return wpn && wpn.type !== 'staff';
  }

  canHeal() {
    return this.items.some(it => it.type === 'staff' && it.usesLeft > 0);
  }

  getHealStaff() {
    return this.items.find(it => it.type === 'staff' && it.usesLeft > 0);
  }

  takeDamage(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    return this.hp <= 0;
  }

  heal(amt) {
    this.hp = Math.min(this.maxHp, this.hp + amt);
  }

  gainExp(amount) {
    this.exp += amount;
    if (this.exp >= 100) {
      this.exp -= 100;
      return this.levelUp();
    }
    return null;
  }

  levelUp() {
    this.level++;
    const gains = {};
    const stats = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];
    for (const stat of stats) {
      const growth = this.growths[stat] || 0;
      let inc = 0;
      // Growth > 100 = guaranteed +1, remainder is chance for +2
      // e.g. growth 130 = +1 guaranteed, 30% chance of +2
      // growth 200 = +2 guaranteed, etc.
      let remaining = growth;
      while (remaining > 0) {
        if (remaining >= 100) {
          inc++;
          remaining -= 100;
        } else {
          if (Math.random() * 100 < remaining) inc++;
          remaining = 0;
        }
      }
      if (inc > 0) {
        gains[stat] = inc;
        if (stat === 'hp') { this.maxHp += inc; this.hp = Math.min(this.maxHp, this.hp + inc); }
        else this[stat] += inc;
      }
    }
    return gains;
  }

  reset() {
    this.acted = false;
    this.moved = false;
  }

  serialize() {
    return {
      charId: this.charId, name: this.name, classId: this.classId,
      level: this.level, exp: this.exp, isLord: this.isLord,
      maxHp: this.maxHp, hp: this.hp, str: this.str, mag: this.mag,
      skl: this.skl, spd: this.spd, lck: this.lck, def: this.def, res: this.res,
      growths: this.growths, portrait: this.portrait,
      items: this.items.map(i => ({ id: i.id, usesLeft: i.usesLeft })),
    };
  }

  static deserialize(data) {
    const unit = new Unit({
      charId: data.charId, name: data.name, classId: data.classId,
      level: data.level, faction: 'player', x: 0, y: 0,
      isLord: data.isLord, portrait: data.portrait, growths: data.growths,
      baseStats: { hp: data.maxHp, str: data.str, mag: data.mag, skl: data.skl, spd: data.spd, lck: data.lck, def: data.def, res: data.res },
    });
    unit.exp = data.exp;
    unit.hp = data.hp;
    unit.items = [];
    for (const idata of (data.items || [])) {
      const item = createItem(idata.id);
      if (item) { item.usesLeft = idata.usesLeft; unit.items.push(item); }
    }
    return unit;
  }
}

function getMovementCost(terrain, unit) {
  if (unit.flying) return 1;
  const td = TERRAIN_DATA[terrain];
  if (!td) return 1;
  if (td.cost >= 999 && !unit.flying) return 999;
  return td.cost;
}

function getMovementRange(unit, terrainMap, allUnits, mapW, mapH) {
  const visited = {};
  const queue = [{ x: unit.x, y: unit.y, remaining: unit.mov }];
  visited[`${unit.x},${unit.y}`] = unit.mov;
  const result = [];

  while (queue.length > 0) {
    const { x, y, remaining } = queue.shift();
    result.push({ x, y });

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= mapW || ny >= mapH) continue;
      const terrain = terrainMap[ny][nx];
      const cost = getMovementCost(terrain, unit);
      if (cost >= 999) continue;
      const newRemaining = remaining - cost;
      if (newRemaining < 0) continue;
      const key = `${nx},${ny}`;
      if (visited[key] !== undefined && visited[key] >= newRemaining) continue;
      // Check for enemy units blocking
      const occupant = allUnits.find(u => u.x === nx && u.y === ny && u.hp > 0);
      if (occupant && occupant.faction !== unit.faction) continue;
      visited[key] = newRemaining;
      queue.push({ x: nx, y: ny, remaining: newRemaining });
    }
  }
  // Remove tiles occupied by other friendly units (except self)
  return result.filter(p => {
    if (p.x === unit.x && p.y === unit.y) return true;
    const occ = allUnits.find(u => u.x === p.x && u.y === p.y && u.hp > 0 && u !== unit);
    return !occ;
  });
}

function getAttackTilesFromPositions(positions, unit, mapW, mapH) {
  const atkRange = unit.getAttackRange();
  if (!atkRange.length) return [];
  const moveSet = new Set(positions.map(p => `${p.x},${p.y}`));
  const atkSet = new Set();
  for (const pos of positions) {
    for (const range of atkRange) {
      for (const [dx, dy] of getAllTilesAtRange(range)) {
        const tx = pos.x + dx, ty = pos.y + dy;
        if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) continue;
        const key = `${tx},${ty}`;
        if (!moveSet.has(key)) atkSet.add(key);
      }
    }
  }
  return [...atkSet].map(k => { const [x,y] = k.split(',').map(Number); return {x,y}; });
}

function getAllTilesAtRange(range) {
  const tiles = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.abs(dx) + Math.abs(dy) === range) tiles.push([dx, dy]);
    }
  }
  return tiles;
}

function getTilesInRange(x, y, ranges, mapW, mapH) {
  const result = [];
  for (const r of ranges) {
    for (const [dx, dy] of getAllTilesAtRange(r)) {
      const tx = x + dx, ty = y + dy;
      if (tx >= 0 && ty >= 0 && tx < mapW && ty < mapH) result.push({x: tx, y: ty});
    }
  }
  return result;
}

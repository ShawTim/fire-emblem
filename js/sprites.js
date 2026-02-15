// sprites.js - Procedural pixel art generation
const Sprites = {
  cache: {},
  TILE: 16,

  getTerrainColor(type) {
    return {
      plain:    { base: '#5a8', dark: '#497', light: '#6b9' },
      forest:   { base: '#385', dark: '#274', light: '#496' },
      mountain: { base: '#887', dark: '#665', light: '#998' },
      wall:     { base: '#556', dark: '#445', light: '#667' },
      gate:     { base: '#776', dark: '#554', light: '#887' },
      river:    { base: '#48c', dark: '#37a', light: '#5ad' },
      village:  { base: '#a86', dark: '#875', light: '#b97' },
    }[type] || { base: '#5a8', dark: '#497', light: '#6b9' };
  },

  drawTerrain(ctx, type, x, y) {
    const s = this.TILE;
    const c = this.getTerrainColor(type);
    ctx.fillStyle = c.base;
    ctx.fillRect(x, y, s, s);
    // Add texture
    ctx.fillStyle = c.dark;
    for (let i = 0; i < 4; i++) {
      const px = x + ((i * 7 + 3) % s);
      const py = y + ((i * 5 + 2) % s);
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.fillStyle = c.light;
    for (let i = 0; i < 3; i++) {
      const px = x + ((i * 11 + 1) % s);
      const py = y + ((i * 9 + 4) % s);
      ctx.fillRect(px, py, 1, 1);
    }
    // Special decorations
    if (type === 'forest') {
      ctx.fillStyle = '#2a5';
      ctx.fillRect(x+4, y+2, 8, 6);
      ctx.fillStyle = '#1a4';
      ctx.fillRect(x+5, y+3, 6, 4);
      ctx.fillStyle = '#653';
      ctx.fillRect(x+7, y+8, 2, 6);
    } else if (type === 'mountain') {
      ctx.fillStyle = '#998';
      ctx.beginPath();
      ctx.moveTo(x+8, y+2);
      ctx.lineTo(x+14, y+13);
      ctx.lineTo(x+2, y+13);
      ctx.fill();
      ctx.fillStyle = '#aaa';
      ctx.fillRect(x+7, y+2, 2, 2);
    } else if (type === 'wall') {
      ctx.fillStyle = '#667';
      ctx.fillRect(x, y, s, 2);
      ctx.fillRect(x, y+7, s, 2);
      ctx.fillRect(x, y+14, s, 2);
      ctx.fillStyle = '#445';
      ctx.fillRect(x+4, y+2, 1, 5);
      ctx.fillRect(x+12, y+2, 1, 5);
      ctx.fillRect(x+8, y+9, 1, 5);
    } else if (type === 'gate') {
      ctx.fillStyle = '#665';
      ctx.fillRect(x+2, y, 12, s);
      ctx.fillStyle = '#443';
      ctx.fillRect(x+5, y+3, 6, 10);
      ctx.fillStyle = '#776';
      ctx.fillRect(x+6, y+4, 4, 8);
    } else if (type === 'river') {
      ctx.fillStyle = '#5ae';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + (i*5+1), y + 6 + (i%2)*2, 4, 1);
      }
    } else if (type === 'village') {
      ctx.fillStyle = '#964';
      ctx.fillRect(x+3, y+5, 10, 8);
      ctx.fillStyle = '#c44';
      ctx.beginPath();
      ctx.moveTo(x+8, y+1);
      ctx.lineTo(x+14, y+5);
      ctx.lineTo(x+2, y+5);
      ctx.fill();
      ctx.fillStyle = '#653';
      ctx.fillRect(x+6, y+9, 4, 4);
    }
    // Grid line
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
  },

  getUnitColors(faction) {
    if (faction === 'player') return { body: '#46a', armor: '#357', accent: '#8af', skin: '#fdb' };
    if (faction === 'enemy')  return { body: '#a33', armor: '#822', accent: '#f88', skin: '#fdb' };
    return { body: '#3a4', armor: '#283', accent: '#8f8', skin: '#fdb' };
  },

  drawUnit(ctx, unit, x, y, grayed) {
    const s = this.TILE;
    const colors = this.getUnitColors(unit.faction);
    const cx = x + s/2, cy = y + s/2;

    if (grayed) ctx.globalAlpha = 0.5;

    // Body
    ctx.fillStyle = colors.body;
    ctx.fillRect(x+4, y+6, 8, 8);
    // Head
    ctx.fillStyle = colors.skin;
    ctx.fillRect(x+5, y+2, 6, 5);
    // Hair (use portrait color if available)
    const hairColor = unit.portrait ? unit.portrait.hair : colors.accent;
    ctx.fillStyle = hairColor;
    ctx.fillRect(x+5, y+1, 6, 2);
    // Eyes
    ctx.fillStyle = unit.portrait ? unit.portrait.eyes : '#222';
    ctx.fillRect(x+6, y+4, 1, 1);
    ctx.fillRect(x+9, y+4, 1, 1);
    // Legs
    ctx.fillStyle = colors.armor;
    ctx.fillRect(x+5, y+14, 2, 2);
    ctx.fillRect(x+9, y+14, 2, 2);

    // Weapon indicator based on class
    const cls = getClassData(unit.classId);
    const weps = cls.weapons || [];
    ctx.fillStyle = '#ddd';
    if (weps.includes('sword')) {
      ctx.fillRect(x+12, y+4, 2, 8); // sword blade
      ctx.fillStyle = '#aa6';
      ctx.fillRect(x+11, y+6, 4, 1); // guard
    } else if (weps.includes('lance')) {
      ctx.fillRect(x+13, y+2, 1, 10);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(x+12, y+2, 3, 2);
    } else if (weps.includes('axe')) {
      ctx.fillRect(x+13, y+3, 1, 9);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(x+11, y+3, 4, 3);
    } else if (weps.includes('bow')) {
      ctx.strokeStyle = '#a86';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x+13, y+8, 4, -1, 1);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else if (weps.includes('staff')) {
      ctx.fillStyle = '#ff8';
      ctx.fillRect(x+13, y+2, 1, 10);
      ctx.fillRect(x+12, y+2, 3, 2);
    } else if (weps.includes('fire') || weps.includes('thunder') || weps.includes('wind') || weps.includes('dark') || weps.includes('light')) {
      ctx.fillStyle = '#f84';
      ctx.fillRect(x+12, y+5, 3, 3);
      ctx.fillStyle = '#ff4';
      ctx.fillRect(x+13, y+4, 1, 1);
    }

    // Boss crown
    if (unit.isBoss) {
      ctx.fillStyle = '#fc0';
      ctx.fillRect(x+5, y, 6, 2);
      ctx.fillRect(x+5, y-1, 1, 1);
      ctx.fillRect(x+8, y-1, 1, 1);
      ctx.fillRect(x+10, y-1, 1, 1);
    }

    // Mounted indicator
    const tags = cls.tags || [];
    if (tags.includes('mounted') || tags.includes('flying')) {
      ctx.fillStyle = tags.includes('flying') ? '#aaf' : '#a86';
      ctx.fillRect(x+2, y+10, 12, 4);
      ctx.fillRect(x+1, y+12, 2, 2);
      ctx.fillRect(x+13, y+12, 2, 2);
    }

    if (grayed) ctx.globalAlpha = 1.0;

    // HP bar
    if (unit.hp !== undefined && unit.maxHp) {
      const hpRatio = unit.hp / unit.maxHp;
      ctx.fillStyle = '#300';
      ctx.fillRect(x+2, y+s-1, 12, 1);
      ctx.fillStyle = hpRatio > 0.5 ? '#4c4' : (hpRatio > 0.25 ? '#cc4' : '#c44');
      ctx.fillRect(x+2, y+s-1, Math.ceil(12 * hpRatio), 1);
    }
  },

  drawPortrait(ctx, charId, w, h) {
    const ch = CHARACTERS[charId];
    if (!ch || !ch.portrait) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, w, h);
      return;
    }
    const p = ch.portrait;
    // Background
    ctx.fillStyle = '#223';
    ctx.fillRect(0, 0, w, h);
    // Face
    ctx.fillStyle = p.skin;
    ctx.fillRect(16, 20, 32, 36);
    // Hair
    ctx.fillStyle = p.hair;
    ctx.fillRect(12, 8, 40, 16);
    ctx.fillRect(12, 8, 8, 40);
    ctx.fillRect(44, 8, 8, 30);
    // Eyes
    ctx.fillStyle = p.eyes;
    ctx.fillRect(22, 32, 6, 4);
    ctx.fillRect(36, 32, 6, 4);
    // Pupils
    ctx.fillStyle = '#111';
    ctx.fillRect(24, 33, 3, 2);
    ctx.fillRect(38, 33, 3, 2);
    // Mouth
    ctx.fillStyle = '#c88';
    ctx.fillRect(28, 44, 8, 2);
    // Nose
    ctx.fillStyle = '#da9';
    ctx.fillRect(31, 38, 3, 4);
  },

  // Seize marker
  drawSeizeMarker(ctx, x, y, frame) {
    const s = this.TILE;
    const alpha = 0.4 + 0.3 * Math.sin(frame * 0.1);
    ctx.fillStyle = `rgba(255,255,0,${alpha})`;
    ctx.fillRect(x+2, y+2, s-4, s-4);
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, s-2, s-2);
    ctx.lineWidth = 1;
  },
};

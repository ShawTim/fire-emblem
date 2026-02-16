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
    // Seeded random for consistent terrain variation
    const seed = (x * 31 + y * 17) & 0xffff;
    const rng = (n) => ((seed * 9301 + 49297 + n * 1234) % 233280) / 233280;

    if (type === 'plain') {
      // Grass with variation
      const greens = ['#5a8','#5b8','#4a7','#6b9','#5a7'];
      ctx.fillStyle = greens[seed % greens.length];
      ctx.fillRect(x, y, s, s);
      // Grass blades
      ctx.fillStyle = '#6c9';
      for (let i = 0; i < 6; i++) {
        const gx = x + Math.floor(rng(i) * 14) + 1;
        const gy = y + Math.floor(rng(i+10) * 10) + 3;
        ctx.fillRect(gx, gy, 1, 2);
      }
      // Occasional flower
      if (rng(99) > 0.85) {
        ctx.fillStyle = rng(88) > 0.5 ? '#ff8' : '#f8f';
        ctx.fillRect(x + 6 + (seed%4), y + 5 + (seed%3), 2, 2);
      }

    } else if (type === 'forest') {
      // Dark grass base
      ctx.fillStyle = '#3a6';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#295';
      ctx.fillRect(x, y+12, s, 4);
      // Tree trunk
      ctx.fillStyle = '#654';
      ctx.fillRect(x+6, y+8, 4, 7);
      ctx.fillStyle = '#543';
      ctx.fillRect(x+7, y+9, 2, 6);
      // Tree canopy (layered circles)
      ctx.fillStyle = '#1a5';
      ctx.fillRect(x+2, y+1, 12, 8);
      ctx.fillStyle = '#2b6';
      ctx.fillRect(x+3, y+0, 10, 7);
      ctx.fillStyle = '#3c7';
      ctx.fillRect(x+4, y+1, 8, 5);
      // Canopy highlights
      ctx.fillStyle = '#4d8';
      ctx.fillRect(x+5, y+2, 3, 2);
      ctx.fillRect(x+9, y+1, 2, 2);
      // Shadow at base
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x+2, y+12, 12, 2);

    } else if (type === 'mountain') {
      // Rocky ground
      ctx.fillStyle = '#887';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#776';
      ctx.fillRect(x, y+12, s, 4);
      // Main peak
      ctx.fillStyle = '#998';
      ctx.beginPath();
      ctx.moveTo(x+8, y+0);
      ctx.lineTo(x+15, y+12);
      ctx.lineTo(x+1, y+12);
      ctx.fill();
      // Shading (left = dark, right = light)
      ctx.fillStyle = '#776';
      ctx.beginPath();
      ctx.moveTo(x+8, y+0);
      ctx.lineTo(x+1, y+12);
      ctx.lineTo(x+8, y+12);
      ctx.fill();
      // Snow cap
      ctx.fillStyle = '#dde';
      ctx.fillRect(x+6, y+0, 4, 3);
      ctx.fillRect(x+7, y+0, 2, 1);
      // Rocky texture
      ctx.fillStyle = '#665';
      ctx.fillRect(x+4, y+8, 2, 1);
      ctx.fillRect(x+10, y+6, 1, 2);
      ctx.fillRect(x+6, y+5, 1, 1);

    } else if (type === 'wall') {
      // Stone wall with brick pattern
      ctx.fillStyle = '#667';
      ctx.fillRect(x, y, s, s);
      // Brick rows
      for (let row = 0; row < 4; row++) {
        const ry = y + row * 4;
        ctx.fillStyle = '#778';
        ctx.fillRect(x, ry, s, 3);
        ctx.fillStyle = '#556';
        ctx.fillRect(x, ry+3, s, 1);
        // Vertical mortar (offset every other row)
        const off = (row % 2) * 5;
        ctx.fillRect(x + off + 3, ry, 1, 3);
        ctx.fillRect(x + off + 10, ry, 1, 3);
      }
      // Top edge highlight
      ctx.fillStyle = '#889';
      ctx.fillRect(x, y, s, 1);

    } else if (type === 'gate') {
      // Stone frame
      ctx.fillStyle = '#776';
      ctx.fillRect(x, y, s, s);
      // Archway
      ctx.fillStyle = '#554';
      ctx.fillRect(x+3, y+0, 10, s);
      // Door
      ctx.fillStyle = '#653';
      ctx.fillRect(x+4, y+4, 8, 12);
      ctx.fillStyle = '#764';
      ctx.fillRect(x+5, y+5, 6, 10);
      // Door planks
      ctx.fillStyle = '#543';
      ctx.fillRect(x+7, y+4, 1, 12);
      // Door handle
      ctx.fillStyle = '#cc8';
      ctx.fillRect(x+9, y+9, 2, 2);
      // Arch top
      ctx.fillStyle = '#887';
      ctx.fillRect(x+4, y+0, 8, 2);
      ctx.fillRect(x+5, y+2, 6, 1);
      // Stone pillars
      ctx.fillStyle = '#888';
      ctx.fillRect(x+1, y+0, 3, s);
      ctx.fillRect(x+12, y+0, 3, s);
      ctx.fillStyle = '#999';
      ctx.fillRect(x+2, y+0, 1, s);
      ctx.fillRect(x+13, y+0, 1, s);

    } else if (type === 'river') {
      // Water with waves
      ctx.fillStyle = '#48c';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#59d';
      ctx.fillRect(x, y+2, s, 4);
      ctx.fillRect(x, y+10, s, 3);
      // Animated-looking wave highlights
      const woff = (seed % 3) * 3;
      ctx.fillStyle = '#6ae';
      ctx.fillRect(x + woff, y+3, 4, 1);
      ctx.fillRect(x + ((woff+7)%14), y+11, 5, 1);
      // Darker depths
      ctx.fillStyle = '#37a';
      ctx.fillRect(x + 2, y+7, 6, 1);
      ctx.fillRect(x + 9, y+5, 4, 1);
      // Foam/ripple
      ctx.fillStyle = '#8cf';
      ctx.fillRect(x + woff + 1, y+2, 2, 1);
      ctx.fillRect(x + ((woff+5)%12), y+10, 3, 1);

    } else if (type === 'village') {
      // Grass base
      ctx.fillStyle = '#5a8';
      ctx.fillRect(x, y, s, s);
      // House body
      ctx.fillStyle = '#b97';
      ctx.fillRect(x+2, y+6, 12, 9);
      ctx.fillStyle = '#a86';
      ctx.fillRect(x+3, y+7, 10, 7);
      // Roof
      ctx.fillStyle = '#c44';
      ctx.beginPath();
      ctx.moveTo(x+8, y+1);
      ctx.lineTo(x+15, y+6);
      ctx.lineTo(x+1, y+6);
      ctx.fill();
      ctx.fillStyle = '#b33';
      ctx.beginPath();
      ctx.moveTo(x+8, y+1);
      ctx.lineTo(x+1, y+6);
      ctx.lineTo(x+8, y+6);
      ctx.fill();
      // Door
      ctx.fillStyle = '#654';
      ctx.fillRect(x+6, y+10, 4, 5);
      ctx.fillStyle = '#765';
      ctx.fillRect(x+7, y+11, 2, 4);
      // Window
      ctx.fillStyle = '#8cf';
      ctx.fillRect(x+10, y+8, 3, 3);
      ctx.fillStyle = '#654';
      ctx.fillRect(x+11, y+8, 1, 3);
      ctx.fillRect(x+10, y+9, 3, 1);
      // Chimney smoke? nah keep it clean

    } else if (type === 'throne') {
      // Ornate floor
      ctx.fillStyle = '#658';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#769';
      ctx.fillRect(x+1, y+1, s-2, s-2);
      // Carpet pattern
      ctx.fillStyle = '#c64';
      ctx.fillRect(x+3, y+3, 10, 10);
      ctx.fillStyle = '#d75';
      ctx.fillRect(x+4, y+4, 8, 8);
      // Throne chair
      ctx.fillStyle = '#cc8';
      ctx.fillRect(x+5, y+2, 6, 3);
      ctx.fillRect(x+6, y+5, 4, 6);
      ctx.fillStyle = '#dd9';
      ctx.fillRect(x+7, y+3, 2, 1);
      // Gems
      ctx.fillStyle = '#f44';
      ctx.fillRect(x+7, y+2, 2, 1);

    } else if (type === 'pillar') {
      // Floor base
      ctx.fillStyle = '#667';
      ctx.fillRect(x, y, s, s);
      // Pillar
      ctx.fillStyle = '#aab';
      ctx.fillRect(x+4, y+0, 8, s);
      ctx.fillStyle = '#bbc';
      ctx.fillRect(x+5, y+0, 6, s);
      ctx.fillStyle = '#ccd';
      ctx.fillRect(x+6, y+0, 3, s);
      // Capital and base
      ctx.fillStyle = '#998';
      ctx.fillRect(x+3, y+0, 10, 2);
      ctx.fillRect(x+3, y+14, 10, 2);

    } else {
      // Default/unknown → plain
      ctx.fillStyle = '#5a8';
      ctx.fillRect(x, y, s, s);
    }

    // Grid line
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
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

    // Try map icon for player characters
    if (unit.charId && unit.faction === 'player' && this._mapIconCache[unit.charId]) {
      const cached = this._mapIconCache[unit.charId];
      if (cached.loaded) {
        // Draw icon with faction-colored border
        ctx.fillStyle = colors.body;
        ctx.fillRect(x, y, s, s);
        ctx.drawImage(cached.img, x+1, y+1, s-2, s-2);
        // Border
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(x+0.5, y+0.5, s-1, s-1);
        // HP indicator bar at bottom
        if (unit.hp !== undefined && unit.maxHp !== undefined) {
          const hpRatio = unit.hp / unit.maxHp;
          ctx.fillStyle = hpRatio > 0.5 ? '#4f4' : hpRatio > 0.25 ? '#ff4' : '#f44';
          ctx.fillRect(x+1, y+s-2, Math.floor((s-2) * hpRatio), 1);
        }
        if (grayed) ctx.globalAlpha = 1;
        return;
      }
    }

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

  _portraitCache: {},
  _portraitCallbacks: [],
  _mapIconCache: {},

  preloadPortraits() {
    const chars = Object.keys(CHARACTERS);
    for (const id of chars) {
      if (!this._portraitCache[id]) {
        const img = new Image();
        img.src = 'portraits/' + id + '.png';
        this._portraitCache[id] = { img, loaded: false, failed: false };
        img.onload = () => {
          this._portraitCache[id].loaded = true;
          this._portraitCallbacks.forEach(cb => cb());
        };
        img.onerror = () => { this._portraitCache[id].failed = true; };
      }
      // Also preload map icons
      if (!this._mapIconCache[id]) {
        const mimg = new Image();
        mimg.src = 'portraits/' + id + '_map.png';
        this._mapIconCache[id] = { img: mimg, loaded: false };
        mimg.onload = () => { this._mapIconCache[id].loaded = true; };
        mimg.onerror = () => { this._mapIconCache[id].loaded = false; };
      }
    }
  },

  onPortraitReady(cb) {
    this._portraitCallbacks.push(cb);
  },

  drawPortrait(ctx, charId, w, h) {
    const ch = CHARACTERS[charId];
    if (!ch) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // Try loading real portrait image
    if (!this._portraitCache[charId]) {
      const img = new Image();
      img.src = 'portraits/' + charId + '.png';
      this._portraitCache[charId] = { img, loaded: false, failed: false };
      img.onload = () => { this._portraitCache[charId].loaded = true; };
      img.onerror = () => { this._portraitCache[charId].failed = true; };
    }

    const cached = this._portraitCache[charId];
    if (cached.loaded) {
      ctx.drawImage(cached.img, 0, 0, w, h);
      return;
    }

    // Fallback: procedural portrait
    if (!ch.portrait) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, w, h);
      return;
    }
    const p = ch.portrait;
    ctx.fillStyle = '#223';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = p.skin;
    ctx.fillRect(16, 20, 32, 36);
    ctx.fillStyle = p.hair;
    ctx.fillRect(12, 8, 40, 16);
    ctx.fillRect(12, 8, 8, 40);
    ctx.fillRect(44, 8, 8, 30);
    ctx.fillStyle = p.eyes;
    ctx.fillRect(22, 32, 6, 4);
    ctx.fillRect(36, 32, 6, 4);
    ctx.fillStyle = '#111';
    ctx.fillRect(24, 33, 3, 2);
    ctx.fillRect(38, 33, 3, 2);
    ctx.fillStyle = '#c88';
    ctx.fillRect(28, 44, 8, 2);
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

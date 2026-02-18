// map.js - Map rendering & camera
const GameMap = {
  terrain: [],
  width: 0,
  height: 0,
  camX: 0,
  camY: 0,
  tileSize: 32,
  scale: 2,

  init(chapter) {
    this.width = chapter.width;
    this.height = chapter.height;
    this.terrain = parseTerrain(chapter.terrain, this.width, this.height);
    this.camX = 0;
    this.camY = 0;
  },

  getTerrain(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 'wall';
    return this.terrain[y][x];
  },

  screenToTile(sx, sy) {
    const ts = this.tileSize * this.scale;
    return {
      x: Math.floor((sx + this.camX) / ts),
      y: Math.floor((sy + this.camY) / ts),
    };
  },

  tileToScreen(tx, ty) {
    const ts = this.tileSize * this.scale;
    return {
      x: tx * ts - this.camX,
      y: ty * ts - this.camY,
    };
  },

  centerOn(tx, ty, canvasW, canvasH) {
    const ts = this.tileSize * this.scale;
    this.camX = tx * ts - canvasW / 2 + ts / 2;
    this.camY = ty * ts - canvasH / 2 + ts / 2;
    this.clampCamera(canvasW, canvasH);
  },

  clampCamera(canvasW, canvasH) {
    const ts = this.tileSize * this.scale;
    const maxX = this.width * ts - canvasW;
    const maxY = this.height * ts - canvasH;
    this.camX = Math.max(0, Math.min(maxX, this.camX));
    this.camY = Math.max(0, Math.min(maxY, this.camY));
  },

  scrollToward(tx, ty, canvasW, canvasH) {
    const ts = this.tileSize * this.scale;
    const sx = tx * ts - this.camX;
    const sy = ty * ts - this.camY;
    const margin = ts * 2;
    if (sx < margin) this.camX -= ts;
    if (sx > canvasW - margin - ts) this.camX += ts;
    if (sy < margin) this.camY -= ts;
    if (sy > canvasH - margin - ts) this.camY += ts;
    this.clampCamera(canvasW, canvasH);
  },

  render(ctx, canvasW, canvasH, frame) {
    const ts = this.tileSize * this.scale;
    const startX = Math.floor(this.camX / ts);
    const startY = Math.floor(this.camY / ts);
    const endX = Math.min(this.width, startX + Math.ceil(canvasW / ts) + 1);
    const endY = Math.min(this.height, startY + Math.ceil(canvasH / ts) + 1);

    // Use offscreen canvas for tile rendering at native res, then scale
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const sx = x * ts - this.camX;
        const sy = y * ts - this.camY;
        const terrain = this.terrain[y][x];
        // Draw scaled
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(this.scale, this.scale);
        Sprites.drawTerrain(ctx, terrain, 0, 0);
        ctx.restore();
      }
    }
  },

  renderOverlay(ctx, tiles, color, canvasW, canvasH, pulse) {
    const ts = this.tileSize * this.scale;
    var now = Date.now();
    for (const t of tiles) {
      const sx = t.x * ts - this.camX;
      const sy = t.y * ts - this.camY;
      if (sx + ts < 0 || sy + ts < 0 || sx > canvasW || sy > canvasH) continue;
      if (pulse) {
        var pulseAlpha = 0.2 + 0.15 * Math.sin(now * 0.004 + t.x * 0.5 + t.y * 0.3);
        ctx.fillStyle = color.replace(/[\d.]+\)$/, pulseAlpha + ')');
      } else {
        ctx.fillStyle = color;
      }
      ctx.fillRect(sx, sy, ts, ts);
    }
  },

  showGrid: false,

  toggleGrid() { this.showGrid = !this.showGrid; },

  renderGrid(ctx, canvasW, canvasH) {
    if (!this.showGrid) return;
    const ts = this.tileSize * this.scale;
    const startX = Math.floor(this.camX / ts);
    const startY = Math.floor(this.camY / ts);
    const endX = Math.min(this.width, startX + Math.ceil(canvasW / ts) + 1);
    const endY = Math.min(this.height, startY + Math.ceil(canvasH / ts) + 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let y = startY; y <= endY; y++) {
      var sy = y * ts - this.camY;
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(canvasW, sy); ctx.stroke();
    }
    for (let x = startX; x <= endX; x++) {
      var sx = x * ts - this.camX;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, canvasH); ctx.stroke();
    }
  },

  renderUnits(ctx, units, canvasW, canvasH, game) {
    const ts = this.tileSize * this.scale;
    for (const unit of units) {
      if (unit.hp <= 0) continue;
      const sx = unit.x * ts - this.camX;
      const sy = unit.y * ts - this.camY;
      if (sx + ts < 0 || sy + ts < 0 || sx > canvasW || sy > canvasH) continue;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(this.scale, this.scale);
      var showGray = unit.acted && ((unit.faction === 'player' && game && game.phase === 'player') || (unit.faction === 'enemy' && game && game.phase === 'enemy'));
      Sprites.drawUnit(ctx, unit, 0, 0, showGray);
      ctx.restore();
    }
  },
};

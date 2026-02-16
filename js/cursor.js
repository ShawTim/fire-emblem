// cursor.js — Grid cursor for keyboard/mouse navigation

const Cursor = {
  x: 0,
  y: 0,
  visible: true,
  frame: 0,

  moveTo(x, y) {
    var nx = Math.max(0, Math.min(GameMap.width - 1, x));
    var ny = Math.max(0, Math.min(GameMap.height - 1, y));
    if (nx !== this.x || ny !== this.y) { if (typeof SFX !== 'undefined') SFX.cursor(); }
    this.x = nx;
    this.y = ny;
  },

  move(dx, dy) {
    this.moveTo(this.x + dx, this.y + dy);
  },

  update(dt) {
    this.frame += dt * 0.004;
  },

  render(ctx, canvasW, canvasH) {
    if (!this.visible) return;
    const ts = GameMap.tileSize * GameMap.scale;
    const sx = this.x * ts - GameMap.camX;
    const sy = this.y * ts - GameMap.camY;
    if (sx + ts < 0 || sy + ts < 0 || sx > canvasW || sy > canvasH) return;

    const pulse = 0.6 + 0.4 * Math.sin(this.frame * 3);
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 1, sy + 1, ts - 2, ts - 2);
    ctx.lineWidth = 1;

    // Corner accents
    const c = 6;
    ctx.strokeStyle = `rgba(255,255,0,${pulse})`;
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath(); ctx.moveTo(sx, sy + c); ctx.lineTo(sx, sy); ctx.lineTo(sx + c, sy); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(sx + ts - c, sy); ctx.lineTo(sx + ts, sy); ctx.lineTo(sx + ts, sy + c); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(sx, sy + ts - c); ctx.lineTo(sx, sy + ts); ctx.lineTo(sx + c, sy + ts); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(sx + ts - c, sy + ts); ctx.lineTo(sx + ts, sy + ts); ctx.lineTo(sx + ts, sy + ts - c); ctx.stroke();
    ctx.lineWidth = 1;
  }
};

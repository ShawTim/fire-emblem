// game/minimap.js — Mini-map system

var MiniMap = {
  /**
   * Show mini-map overlay
   * @param {Game} game — Game instance to access units and map data
   * @param {Function} onClose — Callback when mini-map is closed
   */
  show: function(game, onClose) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'minimap-overlay';
    overlay.style.cssText = [
      'position:absolute;top:0;left:0;right:0;bottom:0',
      'background:rgba(0,0,0,0.85)',
      'display:flex;flex-direction:column;justify-content:center;align-items:center',
      'z-index:200;pointer-events:auto',
    ].join(';');

    // Calculate mini-map size (max 600x400, fit within screen)
    const mapWidth = GameMap.width;
    const mapHeight = GameMap.height;
    const maxWidth = 600;
    const maxHeight = 400;
    const scale = Math.min(maxWidth / mapWidth, maxHeight / mapHeight, 40); // max 40px per tile
    
    const miniW = mapWidth * scale;
    const miniH = mapHeight * scale;

    overlay.innerHTML = `
      <div style="
        background:linear-gradient(160deg,#1a1a2e,#16213e);
        border:2px solid #4a9eff;
        border-radius:10px;
        padding:20px;
        text-align:center;
        font-family:inherit;
      ">
        <div style="font-size:20px;color:#4a9eff;font-weight:bold;margin-bottom:16px">
          🗺️ 地圖縮圖
        </div>
        <canvas id="minimap-canvas" width="${miniW}" height="${miniH}"
          style="
            background:#0a0a1a;
            border:1px solid #333;
            cursor:crosshair;
            display:block;
            margin:0 auto;
          "></canvas>
        <div style="margin-top:12px;font-size:12px;color:#888">
          <span style="color:#4a9eff">🔵 自軍</span>
          <span style="color:#ff6060;margin-left:12px">🔴 敵軍</span>
          <span style="color:#4f4;margin-left:12px">🟢 友軍</span>
          <span style="color:#fff;margin-left:12px">⬜ 鏡頭</span>
          <span style="margin-left:20px">[點擊跳轉] [Esc 關閉]</span>
        </div>
      </div>
    `;

    document.getElementById('ui-overlay').appendChild(overlay);

    // Draw mini-map
    this.draw(document.getElementById('minimap-canvas'), game, scale);

    // Handle click to jump
    const canvas = document.getElementById('minimap-canvas');
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      
      // Center camera on clicked position
      GameMap.centerOn(Math.floor(x), Math.floor(y), game.canvasW, game.canvasH);
      
      // Close mini-map
      overlay.remove();
      if (onClose) onClose();
    });

    // Close on overlay click (outside canvas)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onClose) onClose();
      }
    });

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
        if (onClose) onClose();
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  /**
   * Draw mini-map on canvas
   */
  draw: function(canvas, game, scale) {
    const ctx = canvas.getContext('2d');
    const mapW = GameMap.width;
    const mapH = GameMap.height;

    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw terrain (simplified - just color coding)
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const terrain = GameMap.terrain[y][x];
        const color = this.getTerrainColor(terrain);
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= mapW; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= mapH; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale);
      ctx.lineTo(canvas.width, y * scale);
      ctx.stroke();
    }

    // Draw units
    for (const unit of game.units) {
      if (unit.hp <= 0) continue;
      
      const cx = (unit.x + 0.5) * scale;
      const cy = (unit.y + 0.5) * scale;
      const radius = Math.max(3, scale * 0.3);
      
      // Faction color
      if (unit.faction === 'player') {
        ctx.fillStyle = '#4a9eff';
      } else if (unit.faction === 'enemy') {
        ctx.fillStyle = '#ff6060';
      } else {
        ctx.fillStyle = '#4f4';
      }
      
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // White border for boss
      if (unit.isBoss) {
        ctx.strokeStyle = '#fc0';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw camera viewport rectangle
    const ts = GameMap.tileSize * GameMap.scale;
    const viewX = GameMap.camX / ts * scale;
    const viewY = GameMap.camY / ts * scale;
    const viewW = game.canvasW / ts * scale;
    const viewH = game.canvasH / ts * scale;
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
  },

  /**
   * Get simplified terrain color for mini-map
   */
  getTerrainColor: function(terrain) {
    const colors = {
      'plain': '#3a5a3a',
      'forest': '#2a4a2a',
      'mountain': '#5a5a5a',
      'sea': '#2a3a6a',
      'wall': '#4a4a4a',
      'door': '#6a4a3a',
      'throne': '#8a7a3a',
      'chest': '#8a6a3a',
      'village': '#8a7a5a',
      'shop': '#6a5a8a',
      'boss': '#8a3a3a',
    };
    return colors[terrain] || '#3a3a3a';
  }
};

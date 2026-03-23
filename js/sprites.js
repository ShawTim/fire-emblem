// sprites.js - SNES Fire Emblem style procedural pixel art (32x32)
// 
// Rendering modes:
//   window.RENDER_MODE = 'sprite' (default) - Use PNG sprites from assets/sprites/map/
//   window.RENDER_MODE = 'procedural' - Use canvas-drawn pixel art units
//
// To toggle at runtime: window.RENDER_MODE = 'procedural'; // or 'sprite'

const Sprites = {
  cache: {},
  TILE: 32,
  _frameCounter: 0,
  _portraitCache: {},
  tick: function(frame = 1) { this._frameCounter += frame; },
  _idleFrame: function() { var seq=[0,1,2,1,0]; return seq[Math.floor(this._frameCounter / GAME_CONFIG.ANIMATION_SPEEDS.SLOW) % 5]; },
  _rng: function(seed, n) { return ((seed * 9301 + 49297 + n * 1234) % 233280) / 233280; },
  _seed: function(x, y) { return (x * 31 + y * 17) & 0xffff; },

  getTerrainColor: function(type) {
    return { plain:{base:"#58b848",dark:"#48a838",light:"#68c858"}, forest:{base:"#40a838",dark:"#309828",light:"#50b848"},
      mountain:{base:"#8a7858",dark:"#705838",light:"#a89868"}, fort:{base:"#c8a860",dark:"#a88840",light:"#d8c080"}, wall:{base:"#807870",dark:"#686060",light:"#989088"},
      gate:{base:"#908880",dark:"#706858",light:"#a8a098"}, river:{base:"#3888d0",dark:"#2870b8",light:"#50a0e0"},
      village:{base:"#e0c898",dark:"#c8a878",light:"#ecd8a8"}, throne:{base:"#d83838",dark:"#c82020",light:"#e0b030"},
      pillar:{base:"#b8a888",dark:"#a09070",light:"#d0c0a0"},
      floor:{base:"#c8c0b0",dark:"#b0a898",light:"#dcd4c4"} }[type] || {base:"#58b848",dark:"#48a838",light:"#68c858"};
  },

  // Terrain tile cache: offscreen canvases keyed by "type_tileX_tileY"
  _terrainCache: {},
  _getCachedTile: function(type, tileX, tileY) {
    var key = type + '_' + tileX + '_' + tileY;
    if (this._terrainCache[key]) return this._terrainCache[key];
    var c = document.createElement('canvas');
    c.width = c.height = GAME_CONFIG.TILE_SIZE;
    this.drawTerrain(c.getContext('2d'), type, 0, 0, tileX, tileY);
    this._terrainCache[key] = c;
    return c;
  },
  clearTerrainCache: function() { this._terrainCache = {}; this._overlayCache = {}; this._objectCache = {}; },

  // Object overlay cache: transparent sprites for fort, village, throne, etc.
  _objectCache: {},
  _getCachedObject: function(type, tileX, tileY) {
    var key = 'obj_' + type + '_' + tileX + '_' + tileY;
    if (this._objectCache[key]) return this._objectCache[key];
    var c = document.createElement('canvas');
    c.width = c.height = GAME_CONFIG.TILE_SIZE;
    this.drawObject(c.getContext('2d'), type, 0, 0, tileX, tileY);
    this._objectCache[key] = c;
    return c;
  },

  // --- Terrain Edge Overlay System ---
  // Objects (fort, gate, village, throne, pillar, brazier, stairs, ruins) removed from categories
  // They are now rendered as transparent overlays on top of base terrain
  _terrainCategory: {
    river:'water', sea:'water', basin:'water',
    forest:'vegetation', swamp:'vegetation',
    mountain:'rocky', cliff:'rocky', hill:'rocky',
    wall:'structure',
    floor:'indoor',
    plain:'land', road:'land', pass:'land', desert:'land', bridge:'land'
  },
  _overlayCache: {},

  _edgeSeed: function(tileX, tileY, edge) {
    // Shared seed: both tiles sharing an edge get the same seed for that edge
    if (edge === 'right')  return this._seed(tileX * 2 + 1, tileY * 2);
    if (edge === 'left')   return this._seed(tileX * 2 - 1, tileY * 2);
    if (edge === 'bottom') return this._seed(tileX * 2, tileY * 2 + 1);
    if (edge === 'top')    return this._seed(tileX * 2, tileY * 2 - 1);
    return this._seed(tileX, tileY);
  },

  _edgeVariantPoolSize: {
    waterToLand: 5,
    forestToPlain: 5,
    roadToPlain: 4,
    roadToForest: 4,
    mountainToLand: 4,
    wallEdge: 4,
    landToWater: 4,
    desertEdge: 3,
    genericBoundary: 3
  },

  _pickEdgeVariant: function(tileX, tileY, centerTerrain, side, transitionType) {
    var pool = this._edgeVariantPoolSize[transitionType] || 3;
    var sideCode = side === 'top' ? 11 : side === 'right' ? 17 : side === 'bottom' ? 23 : 29;
    var tHash = 0;
    for (var i = 0; i < transitionType.length; i++) tHash = (tHash + transitionType.charCodeAt(i) * (i + 3)) & 0xffff;
    var cHash = 0;
    for (var j = 0; j < centerTerrain.length; j++) cHash = (cHash + centerTerrain.charCodeAt(j) * (j + 5)) & 0xffff;
    var h = (tileX * 73856093 + tileY * 19349663 + sideCode * 83492791 + tHash * 131 + cHash * 17) >>> 0;
    return h % pool;
  },

  _getNeighborContext: function(tileX, tileY) {
    var center = GameMap.getTerrain(tileX, tileY);
    var centerCat = this._terrainCategory[center] || 'land';
    var dirs = [{dx:0,dy:-1,side:'top'},{dx:0,dy:1,side:'bottom'},{dx:-1,dy:0,side:'left'},{dx:1,dy:0,side:'right'}];
    var result = { center: { terrain: center, category: centerCat } };
    for (var i = 0; i < 4; i++) {
      var d = dirs[i];
      var nT = GameMap.getTerrain(tileX + d.dx, tileY + d.dy);
      var nC = this._terrainCategory[nT] || 'land';
      result[d.side] = { terrain: nT, category: nC, differs: nT !== center, catDiffers: nC !== centerCat };
    }
    return result;
  },

  _getCachedOverlay: function(tileX, tileY) {
    var key = 'ov_' + tileX + '_' + tileY;
    if (this._overlayCache[key] !== undefined) return this._overlayCache[key];
    var nb = this._getNeighborContext(tileX, tileY);
    // Check if overlay needed
    var need = false;
    if (nb.center.terrain === 'forest' || nb.center.terrain === 'wall') {
      need = true; // same-type overlays (connecting canopy / masonry)
    }
    if (nb.top.differs || nb.bottom.differs || nb.left.differs || nb.right.differs) {
      need = true;
    }
    if (!need) { this._overlayCache[key] = null; return null; }
    var c = document.createElement('canvas');
    c.width = c.height = GAME_CONFIG.TILE_SIZE;
    this._drawTerrainOverlay(c.getContext('2d'), nb, tileX, tileY);
    this._overlayCache[key] = c;
    return c;
  },

  // Wavy edge strip — self-contained rounded shape that tapers to 0 at both corners.
  // Uses sin(t*PI) envelope so depth is always 0 at tile boundaries (no sharp cuts).
  _drawIrregularEdge: function(ctx, edge, depth, color, seed, nBase) {
    var s = GAME_CONFIG.TILE_SIZE, self = this;
    ctx.fillStyle = color;

    // Record layer for corner fill patches
    if (this._edgeLayers) {
      if (!this._edgeLayers[edge]) this._edgeLayers[edge] = [];
      this._edgeLayers[edge].push({ depth: depth, color: color });
    }

    // Multi-wave: always 2-4 waves for organic feel (never 1 = too round)
    var numWaves = 2 + Math.floor(self._rng(seed, 777) * 3); // 2, 3, or 4
    var nSamples = 8 + (numWaves - 1) * 3; // 11, 14, or 17 for smooth curves

    var pts = [];
    for (var i = 0; i <= nSamples; i++) {
      var t = i / nSamples;

      // Envelope: sin(πt) outer taper × multi-wave oscillation
      var envelope = Math.sin(t * Math.PI) * (0.45 + 0.55 * Math.abs(Math.sin(numWaves * t * Math.PI)));

      // Wave variation per sample (wider range for more organic feel)
      var wave = depth * (0.6 + self._rng(seed, nBase + i * 7) * 0.8);
      var d = wave * envelope;
      pts.push({ t: t, d: d });
    }
    ctx.beginPath();
    if (edge === 'top' || edge === 'bottom') {
      var baseY = (edge === 'top') ? 0 : s;
      var dir = (edge === 'top') ? 1 : -1;
      // Start at corner (depth=0)
      ctx.moveTo(0, baseY);
      // Smooth curve through all sample points
      for (var j = 0; j < pts.length; j++) {
        var px = pts[j].t * s;
        var py = baseY + pts[j].d * dir;
        if (j === 0) {
          ctx.lineTo(px, py);
        } else {
          // Smooth quadratic through midpoints
          var prevX = pts[j-1].t * s;
          var prevY = baseY + pts[j-1].d * dir;
          var cpx = (prevX + px) / 2;
          var cpy = (prevY + py) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cpx, cpy);
        }
      }
      // End at corner (depth=0 guaranteed by envelope)
      ctx.lineTo(s, baseY);
      ctx.closePath();
    } else {
      var baseX = (edge === 'left') ? 0 : s;
      var dirX = (edge === 'left') ? 1 : -1;
      ctx.moveTo(baseX, 0);
      for (var k = 0; k < pts.length; k++) {
        var py2 = pts[k].t * s;
        var px2 = baseX + pts[k].d * dirX;
        if (k === 0) {
          ctx.lineTo(px2, py2);
        } else {
          var prevX2 = baseX + pts[k-1].d * dirX;
          var prevY2 = pts[k-1].t * s;
          var cpx2 = (prevX2 + px2) / 2;
          var cpy2 = (prevY2 + py2) / 2;
          ctx.quadraticCurveTo(prevX2, prevY2, cpx2, cpy2);
        }
      }
      ctx.lineTo(baseX, s);
      ctx.closePath();
    }
    ctx.fill();
  },

  // Scattered pixel clusters — inner 70% zone to avoid corners
  _drawScatterPixels: function(ctx, edge, count, maxDepth, color, seed, nBase) {
    var s = GAME_CONFIG.TILE_SIZE;
    ctx.fillStyle = color;

    for (var i = 0; i < count; i++) {
      var along = Math.floor(s * 0.15 + this._rng(seed, nBase + i * 2) * s * 0.7);
      var perp = Math.floor(this._rng(seed, nBase + i * 2 + 1) * maxDepth);
      var px, py;
      if (edge === 'top') { px = along; py = perp; }
      else if (edge === 'bottom') { px = along; py = s - 1 - perp; }
      else if (edge === 'left') { px = perp; py = along; }
      else { px = s - 1 - perp; py = along; }
      var w = this._rng(seed, nBase + i + 50) > 0.5 ? 2 : 1;
      ctx.fillRect(px, py, w, 1);
    }
  },

  // --- Transition drawing functions ---

  _drawWaterToLandEdge: function(ctx, edge, neighborTerrain, seed, variant) {
    var v = variant || 0;
    var bankDepth = 5 + (v % 2);
    var fringeDepth = 3 + (v % 2);
    var pebbleCount = 2 + (v % 3);
    // Thick sandy bank encroaching on water tile (wave-shaped)
    this._drawIrregularEdge(ctx, edge, bankDepth, '#d8c880', seed, 2000 + v * 97);
    // Green grass fringe on top (thicker)
    this._drawIrregularEdge(ctx, edge, fringeDepth, '#63b84f', seed, 2050 + v * 89);
    // Inner grass accent
    this._drawIrregularEdge(ctx, edge, 2, '#78cc66', seed, 2080 + v * 83);
    // Foam line at water's edge
    this._drawIrregularEdge(ctx, edge, 1, 'rgba(255,255,255,0.4)', seed, 2150 + v * 71);
    // Anti-jagged soft blend line near bank transition
    this._drawIrregularEdge(ctx, edge, 1, 'rgba(100,160,100,0.3)', seed, 2180 + v * 61);
    // Scattered pebbles on bank
    this._drawScatterPixels(ctx, edge, pebbleCount, 6 + (v % 2), '#b0a070', seed, 2100 + v * 67);
  },

  _drawRoadToPlainEdge: function(ctx, edge, seed, variant) {
    var v = variant || 0;
    // Grass reclaim creeping into road edge
    this._drawIrregularEdge(ctx, edge, 3 + (v % 2), 'rgba(92,174,72,0.42)', seed, 2800 + v * 83);
    this._drawIrregularEdge(ctx, edge, 2, 'rgba(112,194,92,0.28)', seed, 2830 + v * 79);
    this._drawScatterPixels(ctx, edge, 2 + (v % 2), 5 + (v % 2), 'rgba(96,176,76,0.45)', seed, 2860 + v * 71);
  },

  _drawRoadToForestEdge: function(ctx, edge, seed, variant) {
    var v = variant || 0;
    // Darker, denser edge when forest touches road
    this._drawIrregularEdge(ctx, edge, 4 + (v % 2), 'rgba(40,96,32,0.36)', seed, 2900 + v * 89);
    this._drawIrregularEdge(ctx, edge, 2 + ((v >> 1) % 2), 'rgba(56,132,44,0.30)', seed, 2930 + v * 83);
    this._drawScatterPixels(ctx, edge, 3 + (v % 2), 6 + (v % 2), 'rgba(48,120,40,0.46)', seed, 2960 + v * 73);
  },

  _drawForestToPlainEdge: function(ctx, edge, seed, variant) {
    var v = variant || 0;
    var canopyDepth = 5 + (v % 2);
    var underDepth = 3 + ((v >> 1) % 2);
    var leafCount = 3 + (v % 3);
    // Thick canopy shadow on the plain tile
    this._drawIrregularEdge(ctx, edge, canopyDepth, 'rgba(30,80,20,0.2)', seed, 3000 + v * 97);
    // Undergrowth (thicker)
    this._drawIrregularEdge(ctx, edge, underDepth, '#40a838', seed, 3050 + v * 89);
    // Inner vegetation
    this._drawIrregularEdge(ctx, edge, 2, '#309828', seed, 3070 + v * 83);
    // Scattered dark leaves
    this._drawScatterPixels(ctx, edge, leafCount, 8 + (v % 3), '#309828', seed, 3100 + v * 79);
    // Occasional fallen leaf
    if (this._rng(seed, 3200 + v * 53) > 0.42) {
      this._drawScatterPixels(ctx, edge, 1 + (v % 2), 7 + (v % 2), '#8a6838', seed, 3210 + v * 47);
    }
  },

  _drawForestToForestEdge: function(ctx, edge, seed) {
    // Keep only subtle seam; avoid extra mini-tree artifacts between forest tiles.
    var s = GAME_CONFIG.TILE_SIZE;
    ctx.fillStyle = 'rgba(22,84,22,0.08)';
    if (edge === 'top') ctx.fillRect(2, 0, s - 4, 1);
    else if (edge === 'bottom') ctx.fillRect(2, s - 1, s - 4, 1);
    else if (edge === 'left') ctx.fillRect(0, 2, 1, s - 4);
    else ctx.fillRect(s - 1, 2, 1, s - 4);
  },

  _drawWallEdge: function(ctx, edge, neighborTerrain, seed, variant) {
    var v = variant || 0;
    var isIndoor = (this._terrainCategory[neighborTerrain] === 'indoor');
    if (isIndoor) {
      // Clean shadow at wall-floor junction
      this._drawIrregularEdge(ctx, edge, 2 + (v % 2), 'rgba(0,0,0,0.15)', seed, 5000 + v * 53);
    } else {
      // Crumbling bricks / rubble at exposed wall edge
      this._drawScatterPixels(ctx, edge, 2 + (v % 3), 4 + (v % 2), '#989088', seed, 5050 + v * 47);
      // Moss
      if (this._rng(seed, 5100 + v * 31) > 0.45) {
        this._drawScatterPixels(ctx, edge, 1 + (v % 2), 3 + (v % 2), '#507848', seed, 5110 + v * 43);
      }
      // Crack line
      var s = GAME_CONFIG.TILE_SIZE;
      ctx.strokeStyle = '#585048'; ctx.lineWidth = 1;
      ctx.beginPath();
      var ca = 4 + Math.floor(this._rng(seed, 5150 + v * 29) * 12);
      var cb = 6 + Math.floor(this._rng(seed, 5160 + v * 37) * 12);
      if (edge === 'top')    { ctx.moveTo(ca, 0); ctx.lineTo(cb, 4); }
      else if (edge === 'bottom') { ctx.moveTo(ca, s); ctx.lineTo(cb, s - 4); }
      else if (edge === 'left')   { ctx.moveTo(0, ca); ctx.lineTo(4, cb); }
      else                        { ctx.moveTo(s, ca); ctx.lineTo(s - 4, cb); }
      ctx.stroke();
    }
  },

  _drawWallToWallEdge: function(ctx, edge, seed) {
    var s = GAME_CONFIG.TILE_SIZE;
    // Continuous mortar line at seam
    ctx.fillStyle = '#585048';
    if (edge === 'top' || edge === 'bottom') {
      var ey = (edge === 'top') ? 0 : s - 1;
      ctx.fillRect(0, ey, s, 1);
    } else {
      var ex = (edge === 'left') ? 0 : s - 1;
      for (var row = 0; row < 4; row++) {
        var ry = row * 8 + Math.floor(this._rng(seed, 5200 + row) * 6);
        ctx.fillRect(ex, ry, 1, 3);
      }
    }
    // Shared crack spanning boundary (~30%)
    if (this._rng(seed, 5300) > 0.7) {
      ctx.strokeStyle = '#706860'; ctx.lineWidth = 1;
      var ca2 = 6 + Math.floor(this._rng(seed, 5310) * 16);
      ctx.beginPath();
      if (edge === 'top')         { ctx.moveTo(ca2, 0); ctx.lineTo(ca2 + 2, 3); }
      else if (edge === 'bottom') { ctx.moveTo(ca2, s); ctx.lineTo(ca2 + 2, s - 3); }
      else if (edge === 'left')   { ctx.moveTo(0, ca2); ctx.lineTo(3, ca2 + 2); }
      else                        { ctx.moveTo(s, ca2); ctx.lineTo(s - 3, ca2 + 2); }
      ctx.stroke();
    }
  },

  _drawMountainToLandEdge: function(ctx, edge, seed, variant) {
    var v = variant || 0;
    // Thick scree/rubble strip on the land side
    this._drawIrregularEdge(ctx, edge, 4 + (v % 2), '#908870', seed, 6000 + v * 59);
    this._drawIrregularEdge(ctx, edge, 2 + ((v >> 1) % 2), '#a89878', seed, 6030 + v * 61);
    this._drawScatterPixels(ctx, edge, 3 + (v % 2), 7 + (v % 2), '#a89878', seed, 6050 + v * 67);
    // Shadow from elevation
    this._drawIrregularEdge(ctx, edge, 2, 'rgba(0,0,0,0.1)', seed, 6100 + v * 71);
  },

  // Classify edge transition type — must mirror the dispatch if/else chain exactly
  _classifyEdge: function(center, neighbor) {
    if (!neighbor.differs) {
      if (center.terrain === 'forest' && neighbor.terrain === 'forest') return 'forestToForest';
      if (center.terrain === 'wall' && neighbor.terrain === 'wall') return 'wallToWall';
      return null;
    }
    if (center.category === 'water' && neighbor.category !== 'water') return 'waterToLand';
    if (center.terrain === 'road' && neighbor.terrain === 'plain') return 'roadToPlain';
    if (center.terrain === 'road' && neighbor.terrain === 'forest') return 'roadToForest';
    if (center.category === 'land' && neighbor.terrain === 'forest') return 'forestToPlain';
    if (center.terrain === 'wall' && neighbor.category !== 'structure') return 'wallEdge';
    if (center.category === 'land' && neighbor.category === 'rocky') return 'mountainToLand';
    if (center.category === 'land' && neighbor.category === 'water') return 'landToWater';
    if (neighbor.terrain === 'desert' && center.category === 'land' && center.terrain !== 'desert') return 'desertEdge';
    if (neighbor.catDiffers) return 'genericBoundary';
    return null;
  },

  // Master dispatch
  _drawTerrainOverlay: function(ctx, nb, tileX, tileY) {
    var sides = ['top', 'bottom', 'left', 'right'];
    var center = nb.center;
    var s = GAME_CONFIG.TILE_SIZE;

    // B1-B2: Classify edges and compute corner connectivity
    var edgeTypes = {};
    for (var ei = 0; ei < 4; ei++) {
      edgeTypes[sides[ei]] = this._classifyEdge(center, nb[sides[ei]]);
    }
    var corners = {
      topLeft:     edgeTypes.top && edgeTypes.top === edgeTypes.left,
      topRight:    edgeTypes.top && edgeTypes.top === edgeTypes.right,
      bottomLeft:  edgeTypes.bottom && edgeTypes.bottom === edgeTypes.left,
      bottomRight: edgeTypes.bottom && edgeTypes.bottom === edgeTypes.right
    };

    // Layer recording for corner fill
    this._edgeLayers = { top: [], bottom: [], left: [], right: [] };

    for (var i = 0; i < 4; i++) {
      var side = sides[i];
      var n = nb[side];
      var eSeed = this._edgeSeed(tileX, tileY, side);
      var tType = edgeTypes[side];
      var variant = tType ? this._pickEdgeVariant(tileX, tileY, center.terrain, side, tType) : 0;

      // Different-terrain transitions
      if (n.differs) {
        // Water tile → land neighbor: draw bank on water tile
        if (center.category === 'water' && n.category !== 'water') {
          this._drawWaterToLandEdge(ctx, side, n.terrain, eSeed, variant);
        }
        // Road tile → plain neighbor: grass reclaim edge on road
        else if (center.terrain === 'road' && n.terrain === 'plain') {
          this._drawRoadToPlainEdge(ctx, side, eSeed, variant);
        }
        // Road tile → forest neighbor: darker forest encroach edge on road
        else if (center.terrain === 'road' && n.terrain === 'forest') {
          this._drawRoadToForestEdge(ctx, side, eSeed, variant);
        }
        // Land tile → forest neighbor: canopy overhang on land tile
        else if (center.category === 'land' && n.terrain === 'forest') {
          this._drawForestToPlainEdge(ctx, side, eSeed, variant);
        }
        // Wall tile → non-structure: crumbling edge
        else if (center.terrain === 'wall' && n.category !== 'structure') {
          this._drawWallEdge(ctx, side, n.terrain, eSeed, variant);
        }
        // Land tile → mountain/rocky: rubble scatter
        else if (center.category === 'land' && n.category === 'rocky') {
          this._drawMountainToLandEdge(ctx, side, eSeed, variant);
        }
        // Land tile → water: grass overhang onto water
        else if (center.category === 'land' && n.category === 'water') {
          this._drawIrregularEdge(ctx, side, 3 + (variant % 2), 'rgba(88,184,72,0.35)', eSeed, 9000 + variant * 41);
          this._drawIrregularEdge(ctx, side, 2, 'rgba(72,168,56,0.25)', eSeed, 9020 + variant * 37);
        }
        // Desert encroaching on non-desert land
        else if (n.terrain === 'desert' && center.category === 'land' && center.terrain !== 'desert') {
          this._drawIrregularEdge(ctx, side, 2 + (variant % 2), '#d0b878', eSeed, 7000 + variant * 43);
          this._drawScatterPixels(ctx, side, 1 + (variant % 2), 4 + (variant % 2), '#c8a870', eSeed, 7050 + variant * 31);
        }
        // Generic category boundary: subtle shadow
        else if (n.catDiffers) {
          this._drawIrregularEdge(ctx, side, 1, 'rgba(0,0,0,0.06)', eSeed, 9500 + variant * 23);
        }
      }
    }

    // Same-terrain special overlays (blob/mortar style, not corner-filled)
    if (center.terrain === 'forest') {
      for (var j = 0; j < 4; j++) {
        if (nb[sides[j]].terrain === 'forest') {
          this._drawForestToForestEdge(ctx, sides[j], this._edgeSeed(tileX, tileY, sides[j]));
        }
      }
    }
    if (center.terrain === 'wall') {
      for (var k = 0; k < 4; k++) {
        if (nb[sides[k]].terrain === 'wall') {
          this._drawWallToWallEdge(ctx, sides[k], this._edgeSeed(tileX, tileY, sides[k]));
        }
      }
    }

    // Corner fill: concave envelope curve (√x + √y = k) bridging two adjacent edges.
    // When two edges share the same transition type, fill the corner with
    // a concave curve where the boundary curves TOWARD the corner.
    // The filled area is SMALLER than a triangle — like the GBA FE shoreline style.
    var cornerDefs = [
      { key: 'topLeft',     cx: 0, cy: 0, dx: 1,  dy: 1,  edge1: 'top',    edge2: 'left' },
      { key: 'topRight',    cx: s, cy: 0, dx: -1, dy: 1,  edge1: 'top',    edge2: 'right' },
      { key: 'bottomRight', cx: s, cy: s, dx: -1, dy: -1, edge1: 'bottom', edge2: 'right' },
      { key: 'bottomLeft',  cx: 0, cy: s, dx: 1,  dy: -1, edge1: 'bottom', edge2: 'left' }
    ];
    var cSeed = this._seed(tileX * 3, tileY * 3);
    for (var ci = 0; ci < cornerDefs.length; ci++) {
      var cd = cornerDefs[ci];
      if (!corners[cd.key]) continue;

      var layers = this._edgeLayers[cd.edge1];
      if (!layers || layers.length === 0) continue;

      // Draw from outermost (largest depth) to innermost
      for (var li = 0; li < layers.length; li++) {
        // Thicker, rounder corner cap (reduce right-angle look)
        var r = layers[li].depth * (3.0 + this._rng(cSeed, ci * 100 + li * 10) * 0.9);
        ctx.fillStyle = layers[li].color;
        ctx.beginPath();
        ctx.moveTo(cd.cx, cd.cy); // corner point
        // Lower exponent => fuller / rounder bulge near middle
        var nPts = 14;
        var exp = 1.05 + this._rng(cSeed, ci * 100 + 90) * 0.35;
        for (var pi = 0; pi <= nPts; pi++) {
          var ct = pi / nPts;
          var perturb = 1.0 + (this._rng(cSeed, ci * 100 + li * 10 + pi + 50) - 0.5) * 0.12;
          // pow with exp≈2: values are small in the middle → concave curve toward corner
          var px = cd.cx + cd.dx * r * Math.pow(1 - ct, exp) * perturb;
          var py = cd.cy + cd.dy * r * Math.pow(ct, exp) * perturb;
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    this._edgeLayers = null;
  },

  drawTerrain: function(ctx, type, x, y, tileX, tileY) {
    var s=GAME_CONFIG.TILE_SIZE, seed=this._seed(tileX !== undefined ? tileX : x, tileY !== undefined ? tileY : y), self=this;
    const rng = function(n) { return self._rng(seed, n); };
    const R = function(rx,ry,rw,rh,rc) { ctx.fillStyle=rc; ctx.fillRect(rx,ry,rw,rh); };
    const P = function(px,py,pc) { ctx.fillStyle=pc; ctx.fillRect(px,py,1,1); };

    if(type==='plain'){
      // FE GBA-like plain: continuous field + specks/strokes (no horizontal bands)
      R(x,y,s,s,'#63b84f');

      // diagonal grass strokes (\\ direction) for field flow
      for(let i=0;i<18;i++){
        var sx=x+Math.floor(rng(10+i)*30)+1;
        var sy=y+Math.floor(rng(40+i)*28)+2;
        var c = rng(70+i)>0.45 ? '#6dc45a' : '#56a744';
        P(sx,sy,c); P(sx+1,sy+1,c);
        if(rng(90+i)>0.6) P(sx+2,sy+2,c);
      }

      // grass clumps (small arrow-like tufts)
      var numTufts=2+Math.floor(rng(120)*3);
      for(let i=0;i<numTufts;i++){
        var gx=x+4+Math.floor(rng(130+i)*22), gy=y+6+Math.floor(rng(150+i)*20);
        var tc=rng(170+i)>0.5?'#78cc66':'#4f9f3e';
        P(gx,gy,tc); P(gx-1,gy+1,tc); P(gx+1,gy-1,tc);
      }

      // sparse flowers
      if(rng(199)>0.75){
        var fx=x+5+Math.floor(rng(200)*20),fy=y+6+Math.floor(rng(201)*18);
        var fc=rng(202)>0.5?'#ffe074':'#ff9ac8';
        P(fx,fy,fc); P(fx+1,fy,fc);
      }

      // extra micro-specks so grassland is less flat (boosted, visible)
      for(let i=0;i<34;i++) if(rng(220+i)>0.28){
        var mx=x+1+Math.floor(rng(260+i)*30), my=y+1+Math.floor(rng(300+i)*30);
        var mc=rng(340+i)>0.55?'#9dd26d':'#5fa34d';
        P(mx,my,mc);
        if(rng(360+i)>0.62) P(mx+1,my,mc);
      }

      // remove horizontal bottom band; keep only subtle side depth
      R(x, y, 1, s, 'rgba(0,0,0,0.02)');
      R(x+31,y,1,s,'rgba(0,0,0,0.03)');

    }else if(type==='forest'){
      // Forest ground: richer specks/strokes only (avoid rectangle patches)
      R(x,y,s,s,'#4b9d42');

      // 1) denser grass scratches (random short diagonals)
      for(let i=0;i<40;i++){
        var sx2=x+1+Math.floor(rng(760+i)*30), sy2=y+1+Math.floor(rng(780+i)*30);
        var lc=rng(800+i)>0.5?'rgba(148,216,110,0.62)':'rgba(48,116,48,0.52)';
        P(sx2,sy2,lc);
        if(rng(820+i)>0.5) P(sx2+1,sy2+1,lc); else P(sx2+1,sy2-1,lc);
      }

      // 3) yellow-green dry specks (much more visible)
      for(let i=0;i<34;i++) if(rng(850+i)>0.35){
        var dx=x+2+Math.floor(rng(870+i)*28), dy=y+2+Math.floor(rng(890+i)*28);
        var dc=rng(910+i)>0.40 ? '#afd775' : '#dae681';
        P(dx,dy,dc);
        if(rng(930+i)>0.72) P(dx+1,dy,dc);
      }

      // 3b) extra tiny green noise for richer forest floor
      for(let i=0;i<40;i++) if(rng(980+i)>0.30){
        var nx=x+1+Math.floor(rng(1010+i)*30), ny=y+1+Math.floor(rng(1040+i)*30);
        var nc=rng(1070+i)>0.5?'#6eb25b':'#3f8e3d';
        P(nx,ny,nc);
      }

      var dark='#1f6a1b', mid='#2f8528', light='#49a23f', hi='#6abd57', edgeShadow='#1a5617';

      function poly(pts, c){
        ctx.fillStyle=c; ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for(var i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath(); ctx.fill();
      }

      function drawBaseTreeAt(cx, top, seedShift, scaleX, scaleY){
        var sx=(scaleX==null?1:scaleX), sy=(scaleY==null?1:scaleY);
        // hard clamp: never allow tree canopy to go outside this tile
        var halfW = 9*sx;
        var h = 26*sy;
        cx = Math.max(x+halfW, Math.min(x+31-halfW, cx));
        top = Math.max(y+1, Math.min(y+31-h, top));

        ctx.save();
        ctx.translate(cx, top);
        ctx.scale(sx, sy);
        ctx.translate(-cx, -top);

        // droplet: pointed top, broad lower body (locked silhouette)
        poly([
          [cx,top],
          [cx-2,top+2],[cx-4,top+5],[cx-6,top+8],[cx-7,top+11],[cx-8,top+14],
          [cx-9,top+17],[cx-9,top+20],[cx-8,top+22],[cx-6,top+24],[cx-4,top+25],[cx-2,top+26],
          [cx+2,top+26],[cx+4,top+25],[cx+6,top+24],[cx+8,top+22],[cx+9,top+20],[cx+9,top+17],
          [cx+8,top+14],[cx+7,top+11],[cx+6,top+8],[cx+4,top+5],[cx+2,top+2]
        ], dark);

        var jag=[[-1,3],[-3,5],[-5,8],[-7,11],[-8,14],[-9,18],[-8,21],[-6,24],[-3,25],[0,26],[3,25],[6,24],[8,21],[9,18],[8,14],[7,11],[5,8],[3,5],[1,3]];
        for(let i=0;i<jag.length;i++){
          var jx=cx+jag[i][0], jy=top+jag[i][1];
          P(jx,jy,dark);
          if((i%3)===0) P(jx+(jx<cx?-1:1),jy+1,dark);
        }

        poly([
          [cx,top+3],[cx-2,top+5],[cx-4,top+8],[cx-5,top+11],[cx-6,top+14],[cx-6,top+18],
          [cx-5,top+21],[cx-3,top+23],[cx-1,top+24],[cx+1,top+24],[cx+3,top+23],[cx+5,top+21],
          [cx+6,top+18],[cx+6,top+14],[cx+5,top+11],[cx+4,top+8],[cx+2,top+5]
        ], mid);

        poly([[cx-1,top+6],[cx-4,top+9],[cx-4,top+11],[cx-1,top+11],[cx+1,top+9]], light);
        P(cx-2,top+8,hi); P(cx-1,top+9,hi);

        var segs=[[4,15],[5,17],[6,19],[7,21],[7,23],[6,24],[5,25]];
        for(let i=0;i<segs.length;i++){
          var ex=cx+segs[i][0], ey=top+segs[i][1];
          P(ex,ey,edgeShadow);
          if(i===1||i===3||i===5) P(ex+1,ey,edgeShadow);
        }

        var gridY = 10;
        for(let gy=0; gy<5; gy++){
          var baseY = top + gridY + gy*3;
          var rowOffset = (gy % 2 === 0) ? 0 : 2;
          for(let gx=0; gx<5; gx++){
            if(rng(seedShift + 870 + gy*11 + gx*7) < 0.24) continue;
            var baseX = cx - 4 + rowOffset + gx*2;
            var jx = Math.floor(rng(seedShift + 900 + gy*31 + gx*17) * 3) - 1;
            var jy = Math.floor(rng(seedShift + 902 + gy*23 + gx*19) * 3) - 1;
            var nx = baseX + jx;
            var ny = baseY + jy;
            var dx=(nx-cx)/6.0, dy=(ny-(top+16))/7.8;
            if(dx*dx + dy*dy > 1.0) continue;

            var rDot = rng(seedShift + 960 + gy*41 + gx*37);
            var c = rDot > 0.90 ? '#5ea74f' : (rDot > 0.70 ? '#3f8f36' : '#2b7426');
            R(nx,ny,2,2,c);
            if(rng(seedShift + 990 + gy*17 + gx*29) > 0.76){
              var ox = Math.floor(rng(seedShift + 1000 + gy*13 + gx*11) * 3) - 1;
              var oy = Math.floor(rng(seedShift + 1010 + gy*19 + gx*23) * 3) - 1;
              var ex = nx+ox, ey = ny+oy;
              var edx=(ex-cx)/6.0, edy=(ey-(top+16))/7.8;
              if(edx*edx + edy*edy <= 1.0) P(ex, ey, c);
            }
          }
        }

        ctx.restore();
        R(cx-1,top+Math.round(25*sy),1,2,'#4b331d');
      }

      // 隨機 1/2/3 棵（deterministic），樹形鎖死，只改scale/擺位
      var g = [ [6,6], [16,6], [26,6], [6,16], [16,16], [26,16], [6,26], [16,26], [26,26] ];
      function putAt(anchorIdx, seed, sx, sy){
        var a=g[anchorIdx];
        var jx=Math.floor(rng(seed+11)*3)-1;
        var jy=Math.floor(rng(seed+13)*3)-1;
        var top = y + a[1] + jy - Math.round(13*sy);
        drawBaseTreeAt(x+a[0]+jx, top, seed, sx, sy);
      }

      var roll = rng(840);
      var layout = roll < 0.34 ? 1 : (roll < 0.67 ? 2 : 3);

      if(layout===1){
        // 1棵：中央，再加大少少
        putAt(4, 1500, 0.78, 1.12);
      }else if(layout===2){
        // 2棵：左右分散，再加大少少
        putAt(3, 2000, 0.66, 0.98);
        putAt(5, 3000, 0.66, 0.98);
      }else{
        // 3棵：九宮格分散 pattern（避免堆埋）
        var p3 = [
          [2,3,7], // XXO / OXX / XOX
          [0,5,7], // OXX / XXO / XOX
          [1,3,8], // XOX / OXX / XXO
          [1,5,6]  // XOX / XXO / OXX
        ];
        var pIdx = Math.floor(rng(841) * p3.length);
        var pick = p3[pIdx];
        putAt(pick[0], 2000, 0.48, 0.74);
        putAt(pick[1], 3000, 0.48, 0.74);
        putAt(pick[2], 4000, 0.48, 0.74);
      }

      // 4) deeper micro-specks (no rectangular blotches)
      for(let i=0;i<26;i++) if(rng(1120+i)>0.42){
        var bx=x+1+Math.floor(rng(1140+i)*30), by=y+1+Math.floor(rng(1160+i)*30);
        var bc=rng(1180+i)>0.5?'#2f7e32':'#255f28';
        P(bx,by,bc);
      }
      R(x, y, 1, s, 'rgba(24,76,30,0.10)');
      R(x+31, y, 1, s, 'rgba(10,42,16,0.14)');

      if (window.DEBUG_FOREST_VARIANTS) {
        R(x+1,y+1,6,6,'rgba(0,0,0,0.35)');
        ctx.fillStyle='#fff'; ctx.font='6px monospace'; ctx.fillText('T',x+2,y+6);
      }


    }else if(type==='mountain'){
      // FE GBA-like mountain: chunky faceted massif + clear top-left light
      R(x,y,s,s,'#8a7858');
      // foothill / grass contact
      R(x,y+24,s,8,'#5aa84a');
      R(x,y+24,s,1,'#7fc06a');
      R(x,y+31,s,1,'#4a7a3a');

      // Main massif silhouette
      ctx.fillStyle='#7e6744';
      ctx.beginPath();
      ctx.moveTo(x+2,y+24);ctx.lineTo(x+7,y+14);ctx.lineTo(x+12,y+8);
      ctx.lineTo(x+16,y+4);ctx.lineTo(x+21,y+8);ctx.lineTo(x+26,y+13);
      ctx.lineTo(x+30,y+24);ctx.closePath();ctx.fill();

      // Left-lit planes
      ctx.fillStyle='#b59662';
      ctx.beginPath();ctx.moveTo(x+16,y+4);ctx.lineTo(x+7,y+14);ctx.lineTo(x+14,y+23);ctx.lineTo(x+16,y+23);ctx.closePath();ctx.fill();
      ctx.fillStyle='#a98956';
      ctx.beginPath();ctx.moveTo(x+12,y+8);ctx.lineTo(x+6,y+16);ctx.lineTo(x+11,y+23);ctx.lineTo(x+14,y+23);ctx.closePath();ctx.fill();

      // Right shadow planes
      ctx.fillStyle='#654f33';
      ctx.beginPath();ctx.moveTo(x+16,y+4);ctx.lineTo(x+26,y+13);ctx.lineTo(x+18,y+23);ctx.lineTo(x+16,y+23);ctx.closePath();ctx.fill();
      ctx.fillStyle='#5b452d';
      ctx.beginPath();ctx.moveTo(x+21,y+8);ctx.lineTo(x+30,y+24);ctx.lineTo(x+22,y+24);ctx.lineTo(x+18,y+23);ctx.closePath();ctx.fill();

      // Ridge highlights + cracks
      R(x+12,y+9,2,1,'#d6b57a');R(x+15,y+6,2,1,'#debe84');R(x+18,y+10,1,1,'#cfae72');
      ctx.strokeStyle='#4a3a25';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+10,y+15);ctx.lineTo(x+12,y+20);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+19,y+13);ctx.lineTo(x+21,y+19);ctx.stroke();

      // Scree at foot
      for(let i=0;i<6;i++){
        var sx2=x+2+Math.floor(rng(i+300)*26), sw=1+Math.floor(rng(i+310)*3);
        var sy2=y+22+Math.floor(rng(i+320)*4);
        R(sx2,sy2,sw,1,rng(i+330)>0.5?'#9a835c':'#7e6a49');
      }

    }else if(type==='wall'){
      // GBA FE-style stone bricks with damage and moss
      R(x,y,s,s,'#807870');
      for(let row=0;row<4;row++){var ry=y+row*8,off=(row%2)*8;
        for(let col=0;col<3;col++){var bx=x+off+col*16;
          var bci=Math.floor(rng(row*3+col+500)*5);
          var bc=['#908880','#888078','#8c8480','#847c70','#989088'][bci];
          R(bx,ry,15,7,bc);
          R(bx,ry,15,1,'#a0988e');  // top highlight
          R(bx,ry+6,15,1,'#686060');  // bottom shadow
          R(bx+14,ry,1,7,'#686060'); // right shadow
          // Damaged brick: darker corner or 1px chip (1-2 per tile)
          if(rng(row*3+col+520)>0.7){
            var dmx=bx+Math.floor(rng(row*3+col+530)*12),dmy=ry+1+Math.floor(rng(row*3+col+540)*4);
            R(dmx,dmy,2,2,'#706860');
          }
        }
        R(x,ry+7,s,1,'#585048');  // mortar line
      }
      // Top edge highlight
      R(x,y,s,1,'#b0a8a0');
      // Moss patches (~30% of tiles)
      if(rng(550)>0.7){
        var mx=x+Math.floor(rng(551)*20)+2,my=y+Math.floor(rng(552)*4)*8+5;
        R(mx,my,4,3,'#507848');R(mx+1,my+1,2,1,'#608858');
      }

    }else if(type==='river'){
      // GBA FE-style flowing water with segmented waves
      R(x,y,s,s,'#3888d0');
      // Block-level tonal variation (4×4 blocks)
      var rv=['#3080c8','#3888d0','#4090d8','#3484cc','#3c8cd4'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        var ri=Math.floor(rng(by*8+bx+400)*5);
        R(x+bx*4,y+by*4,4,4,rv[ri]);
      }
      // Segmented wave bands (shorter 8-16px segments at offsets)
      for(let wi=0;wi<4;wi++){
        var wy=y+4+wi*7+Math.floor(rng(wi+410)*3);
        var wx=x+Math.floor(rng(wi+420)*8);
        var ww=8+Math.floor(rng(wi+430)*10);
        R(wx,wy,ww,1,'#50a0e0');
        R(wx+2,wy-1,Math.floor(ww*0.5),1,'#70b8f0');
      }
      // Diagonal current lines (thin, 1px)
      ctx.strokeStyle='#2870b8';ctx.lineWidth=1;
      for(let ci=0;ci<3;ci++){
        var cx1=x+Math.floor(rng(ci+440)*20),cy1=y+Math.floor(rng(ci+450)*20);
        ctx.beginPath();ctx.moveTo(cx1,cy1);ctx.lineTo(cx1+8+Math.floor(rng(ci+460)*6),cy1+4);ctx.stroke();
      }
      // Foam specks (2-3 scattered white-ish dots)
      var nFoam=2+Math.floor(rng(470)*2);
      for(let fi=0;fi<nFoam;fi++){
        var ffx=x+4+Math.floor(rng(fi+471)*24),ffy=y+3+Math.floor(rng(fi+481)*26);
        R(ffx,ffy,2,1,'#a0d8ff');
      }
      // Sparkle highlight
      if(rng(490)>0.5){P(x+6+Math.floor(rng(491)*18),y+4+Math.floor(rng(492)*8),'#c0e8ff');}

    }else if(type==='floor'){
      // 宮殿室內石板地板 — 大理石格紋
      R(x,y,s,s,'#c8c0b0');
      // 大理石方格紋（8x8 checkerboard）
      for(let py=0;py<s;py+=8)for(let px=0;px<s;px+=8){
        var chk=((px+py)/8)%2;
        R(x+px,y+py,8,8,chk?'#c0b8a8':'#d0c8b8');
      }
      // 石板接縫線（水平）
      for(let gy=8;gy<s;gy+=8){R(x,y+gy,s,1,'#a09888');}
      // 石板接縫線（垂直）
      for(let gx=8;gx<s;gx+=8){R(x+gx,y,1,s,'#a09888');}
      // 輕微光澤（左上角高光）
      R(x+1,y+1,4,1,'#ddd8cc');R(x+1,y+2,1,3,'#ddd8cc');
      R(x+9,y+1,4,1,'#ddd8cc');R(x+17,y+9,4,1,'#ddd8cc');

    }else if(type==='hill'){
      // GBA-style grassy hill with tonal variation
      R(x,y,s,s,'#58b848');
      // Block-variation base
      var hg=['#50b040','#58b848','#54b444'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,hg[Math.floor(rng(by*8+bx+600)*3)]);
      }
      // Hill mound
      ctx.fillStyle='#68c050';
      ctx.beginPath();ctx.moveTo(x+4,y+28);ctx.quadraticCurveTo(x+16,y+6,x+28,y+28);ctx.fill();
      // Highlight band
      var hillVar=Math.floor(rng(610)*3);
      if(hillVar===0){
        ctx.fillStyle='#78d060';ctx.beginPath();ctx.moveTo(x+10,y+22);ctx.quadraticCurveTo(x+16,y+8,x+22,y+22);ctx.fill();
      }else if(hillVar===1){
        ctx.fillStyle='#50a840';ctx.beginPath();ctx.moveTo(x+6,y+24);ctx.quadraticCurveTo(x+16,y+12,x+26,y+24);ctx.fill();
      }else{
        ctx.fillStyle='#60b848';ctx.beginPath();ctx.moveTo(x+8,y+26);ctx.quadraticCurveTo(x+14,y+10,x+24,y+26);ctx.fill();
      }
      // Shadow on hillside
      ctx.fillStyle='rgba(0,0,0,0.08)';
      ctx.beginPath();ctx.moveTo(x+4,y+28);ctx.quadraticCurveTo(x+10,y+14,x+16,y+28);ctx.fill();
      // Grass tufts on hill
      for(let i=0;i<2;i++){
        var hx=x+8+Math.floor(rng(i+620)*14),hy=y+10+Math.floor(rng(i+630)*10);
        P(hx,hy,'#80e068');P(hx-1,hy-1,'#70d058');P(hx+1,hy-1,'#70d058');
      }

    }else if(type==='swamp'){
      // Murky swamp with varied dark greens and puddles
      R(x,y,s,s,'#3a5828');
      var sg=['#2d4420','#3a5828','#344e24','#385428'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,sg[Math.floor(rng(by*8+bx+650)*4)]);
      }
      // Dark murky puddle
      var px2=x+8+Math.floor(rng(660)*10),ppy=y+10+Math.floor(rng(661)*8);
      ctx.fillStyle='rgba(20,40,10,0.6)';
      ctx.beginPath();ctx.arc(px2,ppy,6+Math.floor(rng(662)*3),0,Math.PI*2);ctx.fill();
      // Reeds/vegetation marks
      for(let i=0;i<3;i++){
        var rx2=x+4+Math.floor(rng(i+670)*24),ry2=y+4+Math.floor(rng(i+680)*24);
        P(rx2,ry2,'#4a6830');P(rx2,ry2-1,'#4a6830');P(rx2,ry2-2,'#587838');
      }
      // Mud spots
      R(x+Math.floor(rng(690)*20)+4,y+Math.floor(rng(691)*20)+6,3,2,'#4a4420');

    }else if(type==='cliff'){
      // FE GBA-like cliff: stepped strata, strong top lip, right-side falloff shadow
      R(x,y,s,s,'#6d5a45');
      // top grass lip
      R(x,y,s,5,'#5aaa4a');
      R(x,y+5,s,1,'#86c270');
      R(x,y+6,s,1,'#4a7a3a');

      // cliff body blocks
      R(x+1,y+7,30,24,'#7a654c');
      R(x+2,y+9,28,21,'#6e5a43');
      // left light / right shadow
      R(x+2,y+8,2,20,'#927b61');
      R(x+28,y+8,2,20,'#4f4030');

      // horizontal strata lines
      R(x+3,y+12,25,1,'#5c4b38');
      R(x+4,y+17,23,1,'#594936');
      R(x+3,y+22,24,1,'#574633');
      R(x+4,y+27,22,1,'#554431');

      // broken ledges / chips
      R(x+6,y+11,3,2,'#8f785d');R(x+12,y+16,2,2,'#8b745a');R(x+19,y+21,3,2,'#876f55');
      R(x+23,y+14,2,2,'#4a3b2c');R(x+10,y+24,2,2,'#4d3d2e');

      // sparse cracks
      ctx.strokeStyle='#443628';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+9,y+13);ctx.lineTo(x+11,y+18);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+20,y+18);ctx.lineTo(x+22,y+23);ctx.stroke();

    }else if(type==='pass'){
      // Mountain pass with worn path
      R(x,y,s,s,'#a09070');
      // Block variation
      var pg=['#988868','#a09070','#a89878','#9c8c6c'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,pg[Math.floor(rng(by*8+bx+750)*4)]);
      }
      // Worn path center
      R(x+8,y,16,s,'#b0a880');
      R(x+10,y,12,s,'#b8b088');
      // Rock details at edges
      R(x+2,y+Math.floor(rng(760)*20)+4,4,3,'#888070');
      R(x+26,y+Math.floor(rng(761)*20)+4,4,3,'#888070');

    }else if(type==='road'){
      // Packed earth road with ruts
      R(x,y,s,s,'#c8b870');
      var rdg=['#c0b068','#c8b870','#d0c078','#c4b46c'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,rdg[Math.floor(rng(by*8+bx+780)*4)]);
      }
      // Scattered pebbles
      for(let i=0;i<3;i++){
        P(x+4+Math.floor(rng(i+790)*24),y+4+Math.floor(rng(i+800)*24),'#a89858');
      }
      // Random stains / shallow pits
      for(let i=0;i<4;i++){
        const px=x+5+Math.floor(rng(i+810)*22);
        const py=y+5+Math.floor(rng(i+820)*22);
        const pw=2+Math.floor(rng(i+830)*3);
        const ph=1+Math.floor(rng(i+840)*2);
        R(px,py,pw,ph,'rgba(120,95,58,0.28)');
      }
      // Tiny random scrape marks (non-directional)
      for(let i=0;i<3;i++){
        const sx=x+4+Math.floor(rng(i+850)*24);
        const sy=y+4+Math.floor(rng(i+860)*24);
        if(rng(i+870)>0.5){
          R(sx,sy,3,1,'rgba(105,82,50,0.22)');
        }else{
          R(sx,sy,1,3,'rgba(105,82,50,0.22)');
        }
      }

    }else if(type==='basin'){
      // Grass basin with small pond
      R(x,y,s,s,'#48a038');
      var bg=['#409030','#48a038','#44983c'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,bg[Math.floor(rng(by*8+bx+820)*3)]);
      }
      // Pond with slight position variation
      var bpx=x+14+Math.floor(rng(830)*4),bpy=y+16+Math.floor(rng(831)*4);
      ctx.fillStyle='#3080b0';ctx.beginPath();ctx.arc(bpx,bpy,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#4898c8';ctx.beginPath();ctx.arc(bpx-1,bpy-1,4,0,Math.PI*2);ctx.fill();
      // Shore detail
      ctx.strokeStyle='#60a858';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(bpx,bpy,7,0.5,2.5);ctx.stroke();

    }else if(type==='sea'){
      // Deep ocean with wave variation
      R(x,y,s,s,'#1a5898');
      var seag=['#144080','#1a5898','#1850a0','#1c5c98'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,seag[Math.floor(rng(by*8+bx+850)*4)]);
      }
      // Wave highlights
      for(let wi=0;wi<3;wi++){
        var swx=x+Math.floor(rng(wi+860)*16),swy=y+4+wi*9+Math.floor(rng(wi+870)*3);
        R(swx,swy,8+Math.floor(rng(wi+880)*8),1,'rgba(255,255,255,0.15)');
      }
      // Foam
      if(rng(890)>0.5){R(x+Math.floor(rng(891)*20)+4,y+Math.floor(rng(892)*20)+6,3,1,'rgba(255,255,255,0.25)');}

    }else if(type==='desert'){
      // Sandy desert with dune contours
      R(x,y,s,s,'#d0b878');
      var dg=['#c8a870','#d0b878','#d8c080','#ccb474'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,dg[Math.floor(rng(by*8+bx+900)*4)]);
      }
      // Dune shadow lines
      ctx.strokeStyle='#b8a060';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+2,y+12+Math.floor(rng(910)*6));ctx.quadraticCurveTo(x+16,y+8+Math.floor(rng(911)*8),x+30,y+14+Math.floor(rng(912)*4));ctx.stroke();
      // Small rock/pebble
      R(x+8+Math.floor(rng(920)*14),y+18+Math.floor(rng(921)*8),2,2,'#a88e58');

    }else if(type==='bridge'){
      // Wooden bridge over water
      R(x,y,s,s,'#3888d0');
      // Water variation underneath
      R(x,y+2,s,4,'#4090d8');R(x,y+26,s,4,'#3080c8');
      // Bridge planks
      var brc=rng(940)>0.5?'#9a7850':'#8a6840';
      R(x+4,y,24,s,brc);
      // Plank lines
      for(let pi=0;pi<4;pi++){
        R(x+4,y+pi*8,24,1,'#705028');
      }
      // Railing
      R(x+4,y,2,s,'#7a5830');R(x+26,y,2,s,'#7a5830');
      // Railing posts
      for(let pp=0;pp<4;pp++){
        R(x+3,y+pp*8+2,4,3,'#8a6840');R(x+25,y+pp*8+2,4,3,'#8a6840');
      }

    }else{R(x,y,s,s,'#58b848');}
    ctx.strokeStyle='rgba(0,0,0,0.08)';ctx.strokeRect(x+0.5,y+0.5,s-1,s-1);
  },

  // --- Object overlay sprites (transparent background, drawn on top of base terrain) ---
  drawObject: function(ctx, type, x, y, tileX, tileY) {
    var s=GAME_CONFIG.TILE_SIZE, seed=this._seed(tileX !== undefined ? tileX : x, tileY !== undefined ? tileY : y), self=this;
    const rng = function(n) { return self._rng(seed, n); };
    const R = function(rx,ry,rw,rh,rc) { ctx.fillStyle=rc; ctx.fillRect(rx,ry,rw,rh); };
    const P = function(px,py,pc) { ctx.fillStyle=pc; ctx.fillRect(px,py,1,1); };
    const drawGroundContactShadow = function(cx, cy, w, h, alpha) {
      var a = alpha || 0.12;
      // Core contact shadow
      ctx.fillStyle = 'rgba(0,0,0,' + a + ')';
      ctx.beginPath();
      ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
      // Slightly offset penumbra toward bottom-right (top-left light)
      ctx.fillStyle = 'rgba(0,0,0,' + (a * 0.65) + ')';
      ctx.beginPath();
      ctx.ellipse(cx + 1.5, cy + 0.8, w * 0.92, h * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    if(type==='fort'){
      // Reference-driven fort: high square walls, front round towers, tall command tower (mid-left)
      drawGroundContactShadow(x + 16, y + 30, 14.8, 2.9, 0.22);
      R(x+3,y+28,26,2,'rgba(0,0,0,0.11)');

      // Outer mass (nearly full tile)
      R(x+3,y+5,26,24,'#977945');
      R(x+4,y+6,24,22,'#ac8d57');

      // High enclosing walls (taller)
      R(x+4,y+4,24,6,'#806339');    // back/top wall (higher)
      R(x+2,y+7,5,22,'#7b5f35');    // left wall (thicker)
      R(x+25,y+7,5,22,'#917347');   // right wall (thicker)
      R(x+5,y+18,23,11,'#856738');   // front wall (higher, clearer)
      // front wall thickness cap + underside shadow
      R(x+5,y+18,23,3,'#a88b57');
      R(x+5,y+28,23,1,'#5f4526');
      R(x+4,y+4,24,1,'#c5a873');

      // crenellations (gear-like teeth) + shadow
      R(x+6,y+3,3,2,'#8e7142'); R(x+10,y+3,3,2,'#8e7142');
      R(x+14,y+3,3,2,'#8e7142'); R(x+18,y+3,3,2,'#8e7142'); R(x+22,y+3,3,2,'#8e7142');
      R(x+6,y+5,19,1,'#5a4324');
      // Inner courtyard (clear, not noisy)
      R(x+8,y+11,16,10,'#b9ad8c');
      R(x+9,y+12,14,8,'#d4cdb3');
      R(x+8,y+11,16,1,'#eee5ca');

      // Central command tower (fatter++)
      R(x+9,y+7,10,14,'#6b512b');
      R(x+10,y+8,8,12,'#886b3d');
      ctx.fillStyle='#5b4425';
      ctx.beginPath();ctx.moveTo(x+8,y+7);ctx.lineTo(x+20,y+7);ctx.lineTo(x+18,y+5);ctx.lineTo(x+10,y+5);ctx.closePath();ctx.fill();
      R(x+13,y+2,1,5,'#553f22');
      R(x+14,y+2,6,2,'#b7332a');
      R(x+14,y+2,6,1,'#d45145');
      // fuzzy contour on command tower
      for(let i=0;i<7;i++){
        if(rng(1040+i)>0.28) P(x+9,y+8+i*2,'rgba(56,40,22,0.36)');
        if(rng(1060+i)>0.28) P(x+19,y+8+i*2,'rgba(56,40,22,0.34)');
      }

      // Back wall crenellations
      R(x+6,y+4,3,3,'#8d7042');
      R(x+10,y+4,3,3,'#8d7042');
      R(x+14,y+4,3,3,'#8d7042');
      R(x+18,y+4,3,3,'#8d7042');
      R(x+22,y+4,3,3,'#8d7042');

      // FE GBA-style fuzzy contour for whole building (fixed: no upward-shifted seam)
      for(let i=0;i<12;i++){
        if(rng(600+i)>0.18) P(x+4+i*2,y+11,'rgba(66,48,27,0.42)');
        if(rng(620+i)>0.26) P(x+4+i*2,y+24,'rgba(58,42,24,0.34)');
      }
      for(let i=0;i<8;i++){
        if(rng(640+i)>0.28) P(x+7,y+9+i*2,'rgba(63,45,24,0.36)');
        if(rng(660+i)>0.28) P(x+25,y+9+i*2,'rgba(63,45,24,0.34)');
      }
      // outer silhouette fuzzy contour (left/right + top)
      for(let i=0;i<20;i++){
        if(rng(900+i)>0.35) P(x+3,y+7+i,'rgba(54,39,21,0.34)');
        if(rng(930+i)>0.35) P(x+28,y+7+i,'rgba(54,39,21,0.32)');
      }
      for(let i=0;i<12;i++){
        if(rng(960+i)>0.30) P(x+5+i*2,y+5,'rgba(56,40,22,0.34)');
      }
      // soft highlights to avoid hard contour look
      for(let i=0;i<6;i++){
        if(rng(680+i)>0.36) P(x+8+i*3,y+12,'rgba(230,211,162,0.30)');
        if(rng(700+i)>0.40) P(x+8+i*3,y+25,'rgba(210,188,140,0.24)');
      }

      // Front wall foreground pass (render after command tower so it overlaps tower base)
      R(x+5,y+18,23,11,'rgba(133,103,56,0.94)');
      R(x+5,y+18,23,3,'rgba(168,139,87,0.92)');
      R(x+5,y+28,23,1,'rgba(95,69,38,0.94)');

      // Weathering/noise on front wall (aged, shadowed)
      for(let i=0;i<22;i++){
        const nx=x+6+Math.floor(rng(1200+i)*21);
        const ny=y+19+Math.floor(rng(1240+i)*9);
        if(rng(1280+i)>0.35) P(nx,ny,'rgba(72,52,29,0.34)');
        if(rng(1320+i)>0.55) P(nx+1,ny,'rgba(178,150,98,0.22)');
      }
      // subtle damp streaks
      for(let i=0;i<5;i++){
        const sx=x+7+Math.floor(rng(1360+i)*19);
        const sy=y+20+Math.floor(rng(1380+i)*6);
        R(sx,sy,1,3,'rgba(52,38,21,0.24)');
      }

      // Gate opening
      R(x+14,y+22,4,7,'#4a3218');
      R(x+15,y+23,2,6,'#35210f');

      // Front two round towers — render LAST so they sit above walls/contours
      const frontTower=(cx, dir, body, top)=>{
        // tower body slightly outside wall line to read as independent cylinder
        R(cx-4,y+17,9,12,body);
        ctx.fillStyle=top;
        ctx.beginPath();ctx.ellipse(cx,y+17,3.9,2.2,0,0,Math.PI*2);ctx.fill();

        // fuzzy tower contour pixels
        for(let i=0;i<8;i++) if(rng(760+cx+i)>0.28) P(cx-4,y+18+i,'rgba(58,40,22,0.44)');
        for(let i=0;i<8;i++) if(rng(780+cx+i)>0.28) P(cx+4,y+18+i,'rgba(58,40,22,0.44)');
        if(rng(800+cx)>0.3) P(cx-2,y+16,'rgba(58,40,22,0.42)');
        if(rng(801+cx)>0.3) P(cx+2,y+16,'rgba(58,40,22,0.42)');
        // soft rim highlight
        if(rng(820+cx)>0.2) P(cx-1,y+16,'rgba(240,219,171,0.65)');
        if(rng(821+cx)>0.35) P(cx,y+16,'rgba(230,206,154,0.55)');

        // separation seam where tower meets front wall (soft)
        const seamX = dir < 0 ? cx+4 : cx-4;
        R(seamX,y+22,1,6,'rgba(48,34,18,0.38)');

        // base shadow
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.beginPath();ctx.ellipse(cx,y+29,3.2,1.1,0,0,Math.PI);ctx.fill();
      };
      frontTower(x+5,-1,'#7e6136','#b19360');   // front-left corner
      frontTower(x+27,1,'#85683b','#ba9c69');   // front-right corner

      // Tower weathering/noise (old stone texture)
      const towerNoise=(cx)=>{
        for(let i=0;i<10;i++){
          const tx=cx-3+Math.floor(rng(1400+cx+i)*6);
          const ty=y+18+Math.floor(rng(1420+cx+i)*9);
          if(rng(1440+cx+i)>0.32) P(tx,ty,'rgba(66,47,26,0.34)');
          if(rng(1460+cx+i)>0.60) P(tx,ty,'rgba(186,158,106,0.24)');
        }
        // tiny crack mark
        const cx2=cx-1+Math.floor(rng(1480+cx)*3);
        const cy2=y+22+Math.floor(rng(1490+cx)*4);
        R(cx2,cy2,1,2,'rgba(46,33,18,0.35)');
      };
      towerNoise(x+5);
      towerNoise(x+27);

    }else if(type==='village'){
      // FE GBA-style village: front wall + two vertical roof parallelograms
      drawGroundContactShadow(x + 16, y + 28, 11.8, 2.3, 0.2);
      R(x+6,y+27,20,2,'rgba(0,0,0,0.1)');

      // front façade (~35-40%)
      R(x+8,y+20,16,8,'#bfa56f');
      R(x+9,y+21,14,6,'#eadcb2');
      R(x+8,y+20,16,1,'#f7ebc4');
      R(x+8,y+27,16,1,'#8e7444');

      // roof (~60-65%): two VERTICAL parallelograms (left big lit, right small shadow)
      // narrowed to ~60% tile width + tuned asymmetric slant
      // big lit plane (left) — reduced slant, shifted right by 2px
      ctx.fillStyle='#e67852';
      ctx.beginPath();
      ctx.moveTo(x+5,y+7);   // TL (wider +2px)
      ctx.lineTo(x+19,y+3);  // TR
      ctx.lineTo(x+19,y+20); // BR
      ctx.lineTo(x+5,y+24);  // BL (wider +2px)
      ctx.closePath();
      ctx.fill();

      // small shadow plane (right) — shifted right by 2px and shorter
      ctx.fillStyle='#32100f';
      ctx.beginPath();
      ctx.moveTo(x+19,y+3);  // TL
      ctx.lineTo(x+26,y+9);  // TR
      ctx.lineTo(x+26,y+24); // BR (shorter)
      ctx.lineTo(x+19,y+18); // BL (shorter)
      ctx.closePath();
      ctx.fill();

      // clear seam + eave line
      ctx.strokeStyle='#ffd0b0'; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+19,y+3);ctx.lineTo(x+19,y+20);ctx.stroke();


      // centered doorway
      R(x+13,y+22,5,6,'#4a2b14');
      R(x+14,y+23,3,5,'#6c4326');
      P(x+17,y+25,'#d5b256');

      // small windows
      R(x+10,y+22,2,3,'#2a2230'); R(x+10,y+23,1,1,'#f0de87');
      R(x+20,y+22,2,3,'#2a2230'); R(x+20,y+23,1,1,'#f0de87');

    }else if(type==='throne'){
      // GBA FE-style ornate throne — golden chair with red cushion on small carpet
      drawGroundContactShadow(x + 16, y + 28.5, 10.5, 2.0, 0.17);
      // Red carpet (smaller, centered)
      R(x+6,y+10,20,20,'#b01818');
      R(x+7,y+11,18,18,'#c82020');
      // Carpet fringe/border
      R(x+6,y+10,20,1,'#d8a020');
      R(x+6,y+29,20,1,'#d8a020');
      R(x+6,y+10,1,20,'#d8a020');
      R(x+25,y+10,1,20,'#d8a020');
      // Carpet inner border
      R(x+7,y+11,18,1,'#a08018');
      R(x+7,y+28,18,1,'#a08018');
      // Throne back (tall golden frame)
      R(x+9,y+2,14,14,'#c8a020');
      R(x+10,y+3,12,12,'#d8b030');
      R(x+11,y+4,10,10,'#e0c040');
      // Back panel (red upholstery)
      R(x+12,y+5,8,8,'#c02020');
      R(x+13,y+6,6,6,'#d03030');
      // Crown ornament at top
      R(x+13,y+1,6,2,'#e8c830');
      R(x+14,y+0,4,2,'#f0d840');
      P(x+15,y+0,'#ff4040');  // center jewel
      P(x+17,y+0,'#ff4040');
      // Side finials
      R(x+9,y+1,2,3,'#d0a820');
      R(x+21,y+1,2,3,'#d0a820');
      // Armrests
      R(x+8,y+12,3,10,'#c8a020');
      R(x+21,y+12,3,10,'#c8a020');
      R(x+8,y+12,3,2,'#e0c040');  // armrest top highlight
      R(x+21,y+12,3,2,'#e0c040');
      // Seat
      R(x+10,y+14,12,6,'#d8b030');
      R(x+11,y+15,10,4,'#c82020');  // red cushion
      R(x+11,y+15,10,1,'#e03838');  // cushion highlight
      // Throne legs
      R(x+9,y+20,3,8,'#b89018');
      R(x+20,y+20,3,8,'#b89018');
      R(x+9,y+27,3,1,'#d0a828');
      R(x+20,y+27,3,1,'#d0a828');
      // Armrest jewels
      P(x+9,y+13,'#40c0ff');
      P(x+22,y+13,'#40c0ff');

    }else if(type==='pillar'){
      // GBA FE-style stone column — warm stone tones, not grey
      // Column shadow on ground
      drawGroundContactShadow(x + 16, y + 30, 9.5, 2.2, 0.2);
      R(x+16,y+6,10,24,'rgba(0,0,0,0.10)');
      R(x+18,y+8,8,20,'rgba(0,0,0,0.05)');
      // Base (wider bottom piece — warm stone)
      R(x+7,y+27,18,3,'#b0a080');
      R(x+6,y+29,20,2,'#a09070');
      R(x+8,y+27,16,1,'#d0c0a0');  // top highlight
      R(x+6,y+30,20,1,'#887860');  // bottom shadow
      // Column shaft — cylindrical shading (warm beige-tan)
      R(x+10,y+5,12,23,'#a09070');   // dark left edge
      R(x+11,y+5,10,23,'#b8a888');   // mid tone
      R(x+12,y+5,8,23,'#c8b898');    // lighter
      R(x+13,y+5,6,23,'#d0c0a0');    // highlight band
      R(x+14,y+6,3,21,'#d8c8a8');    // bright highlight stripe
      // Fluting grooves (darker vertical lines)
      R(x+11,y+7,1,19,'#a89878');
      R(x+19,y+7,1,19,'#a89878');
      R(x+15,y+7,1,19,'#c0b090');  // center groove (lighter)
      // Capital (ornate top piece — warm stone)
      R(x+8,y+3,16,3,'#b8a888');
      R(x+7,y+1,18,3,'#c8b898');
      R(x+6,y+0,20,2,'#d8c8a8');
      // Capital decoration (volute details)
      R(x+7,y+1,2,2,'#a89878');
      R(x+23,y+1,2,2,'#a89878');
      R(x+9,y+4,14,1,'#a09070');  // capital bottom shadow
      // Subtle column texture
      P(x+13,y+10,'#a89878'); P(x+17,y+16,'#a89878');
      P(x+14,y+22,'#d8c8a8'); P(x+12,y+14,'#d8c8a8');

    }else if(type==='gate'){
      // GBA FE-style castle gate — warm stone walls with wooden door, 3/4 view
      drawGroundContactShadow(x + 16, y + 30, 13.5, 2.5, 0.23);
      // Side wall pillars (warm stone matching fort palette)
      R(x+1,y+0,8,32,'#b09048');
      R(x+23,y+0,8,32,'#b09048');
      // Pillar shading
      R(x+1,y+0,2,32,'#907030');  // left dark
      R(x+7,y+0,2,32,'#c0a058');  // left highlight
      R(x+23,y+0,2,32,'#907030');
      R(x+29,y+0,2,32,'#c0a058');
      // Stone block lines
      for(let i=0;i<4;i++){
        R(x+1,y+i*8,8,1,'#806828');
        R(x+23,y+i*8,8,1,'#806828');
      }
      // Stone arch (warm tan)
      ctx.fillStyle='#c0a050';
      ctx.beginPath();ctx.arc(x+16,y+10,8,Math.PI,0);ctx.fill();
      ctx.fillStyle='#c8a858';
      ctx.beginPath();ctx.arc(x+16,y+10,7,Math.PI,0);ctx.fill();
      // Arch keystone
      R(x+14,y+2,4,4,'#d0b060');
      R(x+14,y+2,4,1,'#d8b868');
      // Inner arch shadow
      ctx.fillStyle='#382818';
      ctx.beginPath();ctx.arc(x+16,y+10,6,Math.PI,0);ctx.fill();
      // Wooden door
      R(x+9,y+10,14,22,'#7a5828');
      R(x+10,y+11,12,20,'#8a6838');
      // Door planks
      R(x+12,y+10,1,22,'#6a4820');
      R(x+15,y+10,2,22,'#6a4820');
      R(x+19,y+10,1,22,'#6a4820');
      // Horizontal iron bands
      R(x+9,y+14,14,2,'#5a4018');
      R(x+9,y+22,14,2,'#5a4018');
      // Iron studs
      R(x+10,y+12,2,2,'#a0a098'); R(x+10,y+15,2,2,'#a0a098');
      R(x+20,y+12,2,2,'#a0a098'); R(x+20,y+15,2,2,'#a0a098');
      R(x+10,y+23,2,2,'#a0a098'); R(x+20,y+23,2,2,'#a0a098');
      // Door ring handle
      R(x+20,y+18,2,4,'#c0a030');
      P(x+20,y+19,'#d8b840');

    }else if(type==='brazier'){
      // Iron brazier with flames — transparent overlay
      // Fire glow on floor
      ctx.fillStyle='rgba(255,120,20,0.12)';
      ctx.beginPath();ctx.arc(x+16,y+20,12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,80,10,0.08)';
      ctx.beginPath();ctx.arc(x+16,y+18,8,0,Math.PI*2);ctx.fill();
      // Iron bowl
      R(x+10,y+18,12,8,'#383028');
      R(x+11,y+19,10,6,'#484038');
      R(x+9,y+17,14,2,'#505040');  // rim
      R(x+9,y+17,14,1,'#606050');  // rim highlight
      // Legs
      R(x+10,y+26,2,5,'#302820');
      R(x+20,y+26,2,5,'#302820');
      R(x+15,y+27,2,4,'#302820');
      // Flames (layered)
      ctx.fillStyle='#e04808';
      ctx.beginPath();ctx.moveTo(x+12,y+17);ctx.quadraticCurveTo(x+16,y+4,x+20,y+17);ctx.fill();
      ctx.fillStyle='#ff7820';
      ctx.beginPath();ctx.moveTo(x+13,y+17);ctx.quadraticCurveTo(x+16,y+7,x+19,y+17);ctx.fill();
      ctx.fillStyle='#ffcc30';
      ctx.beginPath();ctx.moveTo(x+14,y+17);ctx.quadraticCurveTo(x+16,y+10,x+18,y+17);ctx.fill();
      // Embers
      if(rng(1010)>0.3){
        P(x+12+Math.floor(rng(1011)*8),y+4+Math.floor(rng(1012)*8),'#ff8040');
        P(x+10+Math.floor(rng(1013)*12),y+2+Math.floor(rng(1014)*6),'#ff6020');
      }

    }else if(type==='stairs'){
      // Stone steps — warm tan stone, transparent overlay
      for(let i=0;i<4;i++){
        var sy2=y+i*8;
        var shade=i%2===0?'#c8b088':'#d0b890';
        R(x+2,sy2,28,7,shade);
        R(x+2,sy2,28,1,'#d8c8a0');  // step edge highlight
        R(x+2,sy2+6,28,1,'#a89068');  // step shadow
        // Side shadows
        R(x+2,sy2,1,7,'#a89068');
        R(x+29,sy2,1,7,'#d8c8a0');
        // Surface texture
        for(let j=0;j<2;j++){
          P(x+6+Math.floor(rng(i*3+j+980)*18),sy2+2+Math.floor(rng(i*3+j+990)*3),'#b8a078');
        }
      }

    }else if(type==='ruins'){
      // Broken stone walls and rubble — warm brown tones
      // Ground rubble/debris shadow
      R(x+4,y+24,24,4,'rgba(0,0,0,0.08)');
      // Broken wall segment (left — warm tan stone)
      R(x+3,y+8,8,20,'#a08848');
      R(x+4,y+9,6,18,'#b09858');
      R(x+3,y+8,8,1,'#c0a868');  // top highlight
      R(x+3,y+27,8,1,'#886830');  // bottom shadow
      // Wall damage (irregular top)
      R(x+3,y+8,3,3,'#b09858');
      R(x+8,y+6,3,5,'#a08848');
      R(x+8,y+6,3,1,'#c0a868');
      // Broken wall segment (right, shorter)
      R(x+20,y+14,8,14,'#a08848');
      R(x+21,y+15,6,12,'#b09858');
      R(x+20,y+14,8,1,'#c0a868');
      R(x+23,y+12,4,4,'#a89050');
      R(x+23,y+12,4,1,'#c0a868');
      // Scattered rubble blocks
      R(x+13,y+22,4,3,'#b8a060');
      R(x+14,y+23,2,1,'#c8b070');
      R(x+10,y+25,3,2,'#a89050');
      R(x+17,y+26,2,2,'#b09858');
      // Moss/vine patches
      R(x+4,y+18,3,2,'#507848');
      R(x+21,y+16,3,2,'#507848');
      P(x+6,y+12,'#608858');
      // Crack lines (darker brown)
      ctx.strokeStyle='#705830';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+5,y+14);ctx.lineTo(x+8,y+20);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+22,y+18);ctx.lineTo(x+24,y+24);ctx.stroke();
    }
  },

  getUnitColors: function(faction) {
    if(faction==='player')return{body:'#3060a8',armor:'#284880',accent:'#70a0e0',skin:'#f0d0b0',cloth:'#4878c0'};
    if(faction==='enemy')return{body:'#a03030',armor:'#802020',accent:'#e07070',skin:'#f0d0b0',cloth:'#c04848'};
    return{body:'#30a040',armor:'#208030',accent:'#70e080',skin:'#f0d0b0',cloth:'#48c058'};
  },

  _drawHead: function(ctx,hx,hy,hair,skin,eyes,w,h){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    R(hx+1,hy+3,w-2,h-3,skin);R(hx+2,hy+2,w-4,h-2,skin);R(hx+3,hy+1,w-6,h-1,skin);
    R(hx+2,hy,w-4,4,hair);R(hx+1,hy+1,w-2,3,hair);R(hx,hy+2,2,4,hair);R(hx+w-2,hy+2,2,4,hair);
    var ey=hy+Math.floor(h*0.5),el=hx+Math.floor(w*0.25),er=hx+Math.floor(w*0.65);
    R(el,ey,2,2,eyes);R(er,ey,2,2,eyes);
    ctx.fillStyle='#111';ctx.fillRect(el+1,ey+1,1,1);ctx.fillRect(er+1,ey+1,1,1);
    ctx.fillStyle='#c08878';ctx.fillRect(hx+Math.floor(w/2),hy+Math.floor(h*0.75),1,1);
  },

  _drawHP: function(ctx,unit,x,y){
    var s=GAME_CONFIG.TILE_SIZE;if(unit.hp!==undefined&&unit.maxHp){var r=unit.hp/unit.maxHp;
    ctx.fillStyle='#300000';ctx.fillRect(x+4,y+s-2,24,2);
    ctx.fillStyle=r>0.5?'#40c040':r>0.25?'#c0c040':'#c04040';ctx.fillRect(x+4,y+s-2,Math.ceil(24*r),2);}
  },

  _drawCrown: function(ctx,x,y){
    ctx.fillStyle='#f0c000';ctx.fillRect(x+10,y,12,3);ctx.fillRect(x+10,y-1,1,1);ctx.fillRect(x+15,y-2,1,1);ctx.fillRect(x+21,y-1,1,1);
    ctx.fillStyle='#ff3030';ctx.fillRect(x+15,y,1,1);
  },

  
  drawUnit: function(ctx,unit,x,y,grayed,sc,faction){
    sc=sc||1;
    faction=faction||'player'; // 'player', 'enemy', 'ally'
    const cls = unit.classId || "soldier";
    const classDef = getClassData(cls);
    
    // Check if new sprite system is defined
    if (classDef && classDef.sprites) {
      if (!this._imgCache) this._imgCache = {};
      
      // Determine which sprite sheet to use:
      // 1. Selected state (_selected) -> walk sprite (selected frames)
      // 2. Has direction (_direction) -> walk sprite (directional frames)
      // 3. Actually moving (vx/vy) -> walk sprite (directional frames)
      // 4. Otherwise -> stand sprite
      const isSelected = !!unit._selected;
      const hasDirection = !!unit._direction;
      const isMoving = (unit.vx || unit.vy);
      const useWalkSprites = isSelected || hasDirection || isMoving;
      
      // Get gender (default to 'm' if not specified)
      const gender = unit.gender || 'm';
      
      // Get sprite key based on gender with cross-gender fallback
      var sKey;
      if (gender === 'f') {
        // Female first, fallback to male
        sKey = useWalkSprites
          ? (classDef.sprites.walk_f || classDef.sprites.move_f || classDef.sprites.walk_m || classDef.sprites.move_m || '')
          : (classDef.sprites.stand_f || classDef.sprites.stand_m || '');
      } else {
        // Male first, fallback to female
        sKey = useWalkSprites
          ? (classDef.sprites.walk_m || classDef.sprites.move_m || classDef.sprites.walk_f || classDef.sprites.move_f || '')
          : (classDef.sprites.stand_m || classDef.sprites.stand_f || '');
      }
      
      // Skip if no valid sprite path
      if (!sKey) {
      } else if (!this._imgCache[sKey]) {
        const img = new Image();
        
        // Handle path resolution for subdirectories like classes/index.html
        if (['/classes/', '/characters/', '/demo/'].some(sub => window.location.pathname.includes(sub))) {
          img.src = '../assets/sprites/map/' + sKey;
        } else {
          img.src = 'assets/sprites/map/' + sKey;
        }

        this._imgCache[sKey] = { img: img, loaded: false };
        (function(key) {
          img.onload = function() { if (Sprites._imgCache[key]) Sprites._imgCache[key].loaded = true; };
          img.onerror = function() { 
            if (Sprites._imgCache[key]) {
              Sprites._imgCache[key].loaded = true; 
              Sprites._imgCache[key].error = true;
            }
          };
        })(sKey);
      }
      
      const sData = sKey ? this._imgCache[sKey] : null;
      if (sData && sData.loaded && !sData.error) {
        // Walk sprites: 15 frames in a single column
        // 0-3: Left, 4-7: Down, 8-11: Up, 12-14: Selected (no direction)
        // Stand sprites: 3 frames in a single column
        
        const isWalkSheet = useWalkSprites && (sKey.includes('walk') || sKey.includes('move'));
        const totalFrames = isWalkSheet ? 15 : 3;
        const sw = sData.img.width;
        const sh = sData.img.height / totalFrames;
        
        var frame, flipX = false;
        
        // Animation speed based on unit's spd stat
        // spd 5 -> slower (divisor 6), spd 15 -> normal (divisor 8), spd 25 -> faster (divisor 12)
        const spd = unit.spd || 10;
        const animSpeed = Math.max(4, Math.min(16, 8 + (spd - 10) / 2));
        
        if (isWalkSheet) {
          // Priority: Moving with direction > Selected > Stand
          // If unit is moving or has a direction, show directional walk sprite
          // Only show selected frames (12-14) when stationary AND selected
          const showDirectional = isMoving || hasDirection;
          
          if (unit._selected && !showDirectional) {
            // Selected but not moving - use frames 12-14 (selected animation)
            const animFrame = Math.floor(this._frameCounter / animSpeed) % 3;
            frame = 12 + animFrame;
          } else {
            // Moving or has direction - use directional frames
            let direction = unit._direction;
            if (!direction && isMoving) {
              if (unit.vx > 0) direction = 'right';
              else if (unit.vx < 0) direction = 'left';
              else if (unit.vy > 0) direction = 'down';
              else if (unit.vy < 0) direction = 'up';
            }
            direction = direction || 'down';
            
            // Map direction to base frame
            var baseFrame;
            if (direction === 'left') {
              baseFrame = 0;
            } else if (direction === 'right') {
              baseFrame = 0;  // Use left frames but flip
              flipX = true;
            } else if (direction === 'down') {
              baseFrame = 4;
            } else if (direction === 'up') {
              baseFrame = 8;
            } else {
              baseFrame = 4;  // Default to down
            }
            
            // Animate through 4 frames for each direction
            const animFrame = Math.floor(this._frameCounter / animSpeed) % 4;
            frame = baseFrame + animFrame;
          }
        } else {
          // Stand animation - simple idle frames
          frame = this._idleFrame();
        }
        
        ctx.save();
        if (grayed) {
          ctx.filter = 'grayscale(100%)';
        } else if (faction === 'enemy') {
          // Blue sprites -> Red for enemies (hue-rotate 140deg + saturate for vivid red)
          ctx.filter = 'hue-rotate(140deg) saturate(1.3) brightness(1.1)';
        } else if (faction === 'ally') {
          // Blue sprites -> Green for allies
          ctx.filter = 'hue-rotate(60deg) saturate(1.2)';
        }
        
        // Map sprites usually don't need scaling down if they are 16x32, we just draw them centered
        const drawW = sw * 1.5;
        const drawH = sh * 1.5;
        const dx = x + (GAME_CONFIG.TILE_SIZE - drawW) / 2;
        const dy = y + (GAME_CONFIG.TILE_SIZE - drawH) - 4;
        
        ctx.imageSmoothingEnabled = false;
        
        // Handle horizontal flip for right direction
        if (flipX) {
          ctx.translate(dx + drawW, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(sData.img, 0, frame * sh, sw, sh, 0, 0, drawW, drawH);
        } else {
          ctx.drawImage(sData.img, 0, frame * sh, sw, sh, dx, dy, drawW, drawH);
        }
        
        ctx.restore();
        
        // Draw HP bar
        if (unit.hp !== undefined && unit.maxHp) {
            const ratio = unit.hp / unit.maxHp;
            ctx.fillStyle = '#000'; ctx.fillRect(x + 3, y + 30, 26, 3);
            ctx.fillStyle = ratio > 0.5 ? '#40c040' : ratio > 0.25 ? '#c0c040' : '#c04040';
            ctx.fillRect(x + 4, y + 31, Math.floor(24 * ratio), 1);
        }
        if (unit.isBoss) {
            ctx.fillStyle = '#fc0';
            ctx.fillRect(x + 10, y - 2, 12, 2);
        }
      }
    }

  },




  _portraitCallbacks: [],

  preloadPortraits: function() {
    const chars = Object.keys(CHARACTERS);
    for (let i = 0; i < chars.length; i++) {
      const id = chars[i];
      if (!this._portraitCache[id]) {
        const img = new Image();
        img.src = 'portraits/' + id + '.png';
        this._portraitCache[id] = { img: img, loaded: false, failed: false };
        (function(cache, pid) {
          cache[pid].img.onload = function() { cache[pid].loaded = true; };
          cache[pid].img.onerror = function() { cache[pid].failed = true; };
        })(this._portraitCache, id);
      }
    }
  },

  // Preload all map sprites from classes.js
  preloadMapSprites: function(onProgress, onComplete) {
    if (!this._imgCache) this._imgCache = {};
    
    // Collect all sprite paths from CLASSES
    const spritesToLoad = [];
    for (var classId in CLASSES) {
      const cls = CLASSES[classId];
      if (cls.sprites) {
        // Add all sprite variants
        const keys = ['stand_m', 'stand_f', 'walk_m', 'walk_f', 'move_m', 'move_f'];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (cls.sprites[key]) {
            spritesToLoad.push(cls.sprites[key]);
          }
        }
      }
    }
    
    // Remove duplicates
    const uniqueSprites = [];
    for (let j = 0; j < spritesToLoad.length; j++) {
      if (uniqueSprites.indexOf(spritesToLoad[j]) === -1) {
        uniqueSprites.push(spritesToLoad[j]);
      }
    }
    
    let loaded = 0;
    const total = uniqueSprites.length;
    
    if (total === 0) {
      if (onComplete) onComplete();
      return;
    }
    
    for (let k = 0; k < uniqueSprites.length; k++) {
      const sKey = uniqueSprites[k];
      if (!this._imgCache[sKey]) {
        const img = new Image();
        img.src = 'assets/sprites/map/' + sKey;
        this._imgCache[sKey] = { img: img, loaded: false };
        
        (function(key, self) {
          img.onload = function() {
            self._imgCache[key].loaded = true;
            loaded++;
            if (onProgress) onProgress(loaded, total);
            if (loaded >= total && onComplete) onComplete();
          };
          img.onerror = function() {
            self._imgCache[key].loaded = true;
            self._imgCache[key].error = true;
            loaded++;
            if (onProgress) onProgress(loaded, total);
            if (loaded >= total && onComplete) onComplete();
          };
        })(sKey, this);
      } else {
        loaded++;
        if (onProgress) onProgress(loaded, total);
      }
    }
    
    // If all already cached, call complete immediately
    if (loaded >= total && onComplete) onComplete();
  },

  onPortraitReady: function(cb) { this._portraitCallbacks.push(cb); },

  drawGenericPortrait: function(ctx, unit, w, h) {
    const cls = getClassData(unit.classId);
    const colors = this.getUnitColors(unit.faction);
    const seed = (unit.classId || "").length * 31 + (unit.level || 1) * 7;
    ctx.fillStyle = unit.faction === 'enemy' ? '#2a1018' : '#182a10';
    ctx.fillRect(0, 0, w, h);
    const skinTones = ['#dba','#ecb','#fdb','#ca9','#eda'];
    ctx.fillStyle = skinTones[seed % skinTones.length];
    ctx.fillRect(w*0.25, h*0.2, w*0.5, h*0.55);
    const hairColors = ['#444','#654','#543','#765','#333','#876'];
    ctx.fillStyle = hairColors[seed % hairColors.length];
    if (cls.tags && cls.tags.includes('armored')) {
      ctx.fillStyle = '#888'; ctx.fillRect(w*0.2, h*0.05, w*0.6, h*0.3);
      ctx.fillStyle = '#777'; ctx.fillRect(w*0.25, h*0.35, w*0.5, h*0.08);
    } else if (cls.weapons && cls.weapons.includes('staff')) {
      ctx.fillStyle = '#ddc'; ctx.fillRect(w*0.15, h*0.05, w*0.7, h*0.25);
      ctx.fillRect(w*0.1, h*0.15, w*0.2, h*0.3); ctx.fillRect(w*0.7, h*0.15, w*0.2, h*0.3);
    } else {
      ctx.fillRect(w*0.2, h*0.05, w*0.6, h*0.2);
      ctx.fillRect(w*0.15, h*0.1, w*0.15, h*0.25); ctx.fillRect(w*0.7, h*0.1, w*0.15, h*0.25);
    }
    ctx.fillStyle = '#222';
    ctx.fillRect(w*0.32, h*0.42, w*0.1, h*0.08); ctx.fillRect(w*0.58, h*0.42, w*0.1, h*0.08);
    ctx.fillStyle = '#a86'; ctx.fillRect(w*0.38, h*0.6, w*0.24, h*0.05);
    ctx.fillStyle = colors.body; ctx.fillRect(w*0.1, h*0.75, w*0.8, h*0.25);
    ctx.fillStyle = colors.armor; ctx.fillRect(w*0.2, h*0.8, w*0.6, h*0.15);
    if (unit.isBoss) {
      ctx.fillStyle = '#fc0';
      ctx.fillRect(w*0.3, h*0.0, w*0.4, h*0.08);
      ctx.fillRect(w*0.3, h*0.0, w*0.08, h*0.12);
      ctx.fillRect(w*0.46, h*0.0, w*0.08, h*0.12);
      ctx.fillRect(w*0.62, h*0.0, w*0.08, h*0.12);
    }
  },

  drawPortrait: function(ctx, charId, w, h) {
    const ch = CHARACTERS[charId];
    if (!ch) { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, h); return; }
    if (!this._portraitCache[charId]) {
      const img = new Image();
      img.src = 'portraits/' + charId + '.png';
      this._portraitCache[charId] = { img: img, loaded: false, failed: false };
      img.onload = function() { Sprites._portraitCache[charId].loaded = true; };
      img.onerror = function() { Sprites._portraitCache[charId].failed = true; };
    }
    const cached = this._portraitCache[charId];
    if (cached.loaded) { ctx.drawImage(cached.img, 0, 0, w, h); return; }
    if (!ch.portrait) { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, h); return; }
    const p = ch.portrait;
    ctx.fillStyle = '#223'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = p.skin; ctx.fillRect(16, 20, 32, 36);
    ctx.fillStyle = p.hair; ctx.fillRect(12, 8, 40, 16);
    ctx.fillRect(12, 8, 8, 40); ctx.fillRect(44, 8, 8, 30);
    ctx.fillStyle = p.eyes; ctx.fillRect(22, 32, 6, 4); ctx.fillRect(36, 32, 6, 4);
    ctx.fillStyle = '#111'; ctx.fillRect(24, 33, 3, 2); ctx.fillRect(38, 33, 3, 2);
    ctx.fillStyle = '#c88'; ctx.fillRect(28, 44, 8, 2);
    ctx.fillStyle = '#da9'; ctx.fillRect(31, 38, 3, 4);
  },

  drawSeizeMarker: function(ctx, x, y, frame) {
    const s = GAME_CONFIG.TILE_SIZE;
    const alpha = 0.3 + 0.25 * Math.sin(frame * 0.1);
    // Outer glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,0,0.8)';
    ctx.shadowBlur = 8 + 4 * Math.sin(frame * 0.08);
    ctx.fillStyle = 'rgba(255,255,0,' + alpha + ')';
    ctx.fillRect(x+2, y+2, s-4, s-4);
    ctx.restore();
    // Animated border
    ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, s-2, s-2);
    // Inner diamond pulse
    const da = 0.4 + 0.3 * Math.sin(frame * 0.12);
    ctx.save();
    ctx.globalAlpha = da;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x+s/2, y+4); ctx.lineTo(x+s-4, y+s/2);
    ctx.lineTo(x+s/2, y+s-4); ctx.lineTo(x+4, y+s/2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1;
  },

};

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
      mountain:{base:"#a09880",dark:"#887868",light:"#b0a890"}, fort:{base:"#8a9a8a",dark:"#6a7a6a",light:"#aabaaa"}, wall:{base:"#807870",dark:"#686060",light:"#989088"},
      gate:{base:"#908880",dark:"#706858",light:"#a8a098"}, river:{base:"#3888d0",dark:"#2870b8",light:"#50a0e0"},
      village:{base:"#e0c898",dark:"#c8a878",light:"#ecd8a8"}, throne:{base:"#d83838",dark:"#c82020",light:"#e0b030"},
      pillar:{base:"#b0b0c0",dark:"#a8a8b8",light:"#c0c0d0"},
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
  clearTerrainCache: function() { this._terrainCache = {}; this._overlayCache = {}; },

  // --- Terrain Edge Overlay System ---
  _terrainCategory: {
    river:'water', sea:'water', basin:'water',
    forest:'vegetation', swamp:'vegetation',
    mountain:'rocky', cliff:'rocky', hill:'rocky',
    wall:'structure', gate:'structure', fort:'structure',
    floor:'indoor', pillar:'indoor', stairs:'indoor', brazier:'indoor', throne:'indoor',
    plain:'land', village:'land', road:'land', pass:'land', desert:'land', ruins:'land', bridge:'land'
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

  _drawWaterToLandEdge: function(ctx, edge, neighborTerrain, seed) {
    // Thick sandy bank encroaching on water tile (wave-shaped)
    this._drawIrregularEdge(ctx, edge, 6, '#c8b870', seed, 2000);
    // Green grass fringe on top (thicker)
    this._drawIrregularEdge(ctx, edge, 4, '#58b848', seed, 2050);
    // Inner grass accent
    this._drawIrregularEdge(ctx, edge, 2, '#68c858', seed, 2080);
    // Foam line at water's edge
    this._drawIrregularEdge(ctx, edge, 1, 'rgba(160,216,255,0.5)', seed, 2150);
    // Scattered pebbles on bank
    this._drawScatterPixels(ctx, edge, 3, 7, '#a0b060', seed, 2100);
  },

  _drawForestToPlainEdge: function(ctx, edge, seed) {
    // Thick canopy shadow on the plain tile
    this._drawIrregularEdge(ctx, edge, 6, 'rgba(30,80,20,0.2)', seed, 3000);
    // Undergrowth (thicker)
    this._drawIrregularEdge(ctx, edge, 4, '#40a838', seed, 3050);
    // Inner vegetation
    this._drawIrregularEdge(ctx, edge, 2, '#309828', seed, 3070);
    // Scattered dark leaves
    this._drawScatterPixels(ctx, edge, 4, 10, '#309828', seed, 3100);
    // Occasional fallen leaf
    if (this._rng(seed, 3200) > 0.5) {
      this._drawScatterPixels(ctx, edge, 2, 8, '#8a6838', seed, 3210);
    }
  },

  _drawForestToForestEdge: function(ctx, edge, seed) {
    // Connecting canopy blob bridging tiles
    var s = GAME_CONFIG.TILE_SIZE;
    var bx, by;
    if (edge === 'top')    { bx = 6 + Math.floor(this._rng(seed, 4000) * 20); by = 2; }
    else if (edge === 'bottom') { bx = 6 + Math.floor(this._rng(seed, 4000) * 20); by = s - 2; }
    else if (edge === 'left')   { bx = 2; by = 6 + Math.floor(this._rng(seed, 4000) * 20); }
    else                        { bx = s - 2; by = 6 + Math.floor(this._rng(seed, 4000) * 20); }
    var r = 3 + Math.floor(this._rng(seed, 4010) * 3);
    // Dark shadow layer
    ctx.fillStyle = '#1a7810';
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    // Brighter top layer
    ctx.fillStyle = '#288a20';
    ctx.beginPath(); ctx.arc(bx, by - 1, r - 1, 0, Math.PI * 2); ctx.fill();
    // Highlight specks
    this._drawScatterPixels(ctx, edge, 2, 4, '#60c850', seed, 4050);
  },

  _drawWallEdge: function(ctx, edge, neighborTerrain, seed) {
    var isIndoor = (this._terrainCategory[neighborTerrain] === 'indoor');
    if (isIndoor) {
      // Clean shadow at wall-floor junction
      this._drawIrregularEdge(ctx, edge, 2, 'rgba(0,0,0,0.15)', seed, 5000);
    } else {
      // Crumbling bricks / rubble at exposed wall edge
      this._drawScatterPixels(ctx, edge, 3, 4, '#989088', seed, 5050);
      // Moss
      if (this._rng(seed, 5100) > 0.5) {
        this._drawScatterPixels(ctx, edge, 2, 3, '#507848', seed, 5110);
      }
      // Crack line
      var s = GAME_CONFIG.TILE_SIZE;
      ctx.strokeStyle = '#585048'; ctx.lineWidth = 1;
      ctx.beginPath();
      var ca = 4 + Math.floor(this._rng(seed, 5150) * 12);
      var cb = 6 + Math.floor(this._rng(seed, 5160) * 12);
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

  _drawMountainToLandEdge: function(ctx, edge, seed) {
    // Thick scree/rubble strip on the land side
    this._drawIrregularEdge(ctx, edge, 5, '#908870', seed, 6000);
    this._drawIrregularEdge(ctx, edge, 3, '#a89878', seed, 6030);
    this._drawScatterPixels(ctx, edge, 4, 8, '#a89878', seed, 6050);
    // Shadow from elevation
    this._drawIrregularEdge(ctx, edge, 2, 'rgba(0,0,0,0.1)', seed, 6100);
  },

  // Classify edge transition type — must mirror the dispatch if/else chain exactly
  _classifyEdge: function(center, neighbor) {
    if (!neighbor.differs) {
      if (center.terrain === 'forest' && neighbor.terrain === 'forest') return 'forestToForest';
      if (center.terrain === 'wall' && neighbor.terrain === 'wall') return 'wallToWall';
      return null;
    }
    if (center.category === 'water' && neighbor.category !== 'water') return 'waterToLand';
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

      // Different-terrain transitions
      if (n.differs) {
        // Water tile → land neighbor: draw bank on water tile
        if (center.category === 'water' && n.category !== 'water') {
          this._drawWaterToLandEdge(ctx, side, n.terrain, eSeed);
        }
        // Land tile → forest neighbor: canopy overhang on land tile
        else if (center.category === 'land' && n.terrain === 'forest') {
          this._drawForestToPlainEdge(ctx, side, eSeed);
        }
        // Wall tile → non-structure: crumbling edge
        else if (center.terrain === 'wall' && n.category !== 'structure') {
          this._drawWallEdge(ctx, side, n.terrain, eSeed);
        }
        // Land tile → mountain/rocky: rubble scatter
        else if (center.category === 'land' && n.category === 'rocky') {
          this._drawMountainToLandEdge(ctx, side, eSeed);
        }
        // Land tile → water: grass overhang onto water
        else if (center.category === 'land' && n.category === 'water') {
          this._drawIrregularEdge(ctx, side, 4, 'rgba(88,184,72,0.35)', eSeed, 9000);
          this._drawIrregularEdge(ctx, side, 2, 'rgba(72,168,56,0.25)', eSeed, 9020);
        }
        // Desert encroaching on non-desert land
        else if (n.terrain === 'desert' && center.category === 'land' && center.terrain !== 'desert') {
          this._drawIrregularEdge(ctx, side, 3, '#d0b878', eSeed, 7000);
          this._drawScatterPixels(ctx, side, 2, 5, '#c8a870', eSeed, 7050);
        }
        // Generic category boundary: subtle shadow
        else if (n.catDiffers) {
          this._drawIrregularEdge(ctx, side, 1, 'rgba(0,0,0,0.06)', eSeed, 9500);
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

    // Corner fill: concave patches on top of edges (x*y = r² style)
    // Edges taper to 0 at corners via sin(πt). Where 2 adjacent edges share
    // the same transition type, paint a concave fill to bridge the gap.
    // Shape: parametric power curve with exponent ~1.3 (gentle concavity)
    var cornerDefs = [
      // key, corner pixel coords, dx/dy directions pointing INTO tile
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
        // Generous radius: 1.2-1.6x the layer depth so the fill is clearly visible
        var r = layers[li].depth * (1.2 + this._rng(cSeed, ci * 100 + li * 10) * 0.4);
        ctx.fillStyle = layers[li].color;
        ctx.beginPath();
        ctx.moveTo(cd.cx, cd.cy); // corner point
        // Gentle concave curve (exponent 1.3): fills most of the triangle
        // while still curving inward like x*y = r²
        var nPts = 6;
        var pow = 1.2 + this._rng(cSeed, ci * 100 + 90) * 0.3; // 1.2-1.5
        for (var pi = 0; pi <= nPts; pi++) {
          var ct = pi / nPts;
          var perturb = 1.0 + (this._rng(cSeed, ci * 100 + li * 10 + pi + 50) - 0.5) * 0.25;
          var px = cd.cx + cd.dx * r * Math.pow(1 - ct, pow) * perturb;
          var py = cd.cy + cd.dy * r * Math.pow(ct, pow) * perturb;
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
      // GBA FE-style grass: smooth block variation + organic tufts
      R(x,y,s,s,'#58b848');
      // 4×4 block tonal patches (8 blocks per row = 64 blocks)
      var gr=['#50b040','#58b848','#60c050','#54b444','#5cbc4c'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        var bi=Math.floor(rng(by*8+bx)*5);
        R(x+bx*4,y+by*4,4,4,gr[bi]);
      }
      // Subtle 2×2 dither accents (GBA-style strategic color placement)
      for(let i=0;i<6;i++){
        var dx=x+Math.floor(rng(i+40)*28)+2,dy=y+Math.floor(rng(i+50)*28)+2;
        var dc=rng(i+60)>0.5?'#4ca83c':'#64c454';
        R(dx,dy,2,2,dc);
      }
      // Grass tufts — organic inverted-V shapes
      var numTufts=2+Math.floor(rng(10)*3);
      for(let i=0;i<numTufts;i++){
        var gx=x+Math.floor(rng(i+70)*24)+4,gy=y+Math.floor(rng(i+80)*22)+6;
        var tc=rng(i+90)>0.5?'#68c858':'#48a838';
        P(gx,gy,tc);P(gx-1,gy-1,tc);P(gx+1,gy-1,tc);
        P(gx,gy-2,'#70d060');
        if(rng(i+95)>0.6){P(gx-2,gy-2,tc);P(gx+2,gy-2,tc);}
      }
      // Occasional flowers (small 2×1 or 1×1 clusters)
      if(rng(99)>0.7){
        var fx=x+4+Math.floor(rng(100)*22),fy=y+6+Math.floor(rng(101)*18);
        var fc=rng(102)>0.5?'#ffe860':'#ff90d0';
        P(fx,fy,fc);P(fx+1,fy,fc);
        P(fx,fy+1,'#50b040');
      }
      // Subtle bottom/right edge shadow
      R(x,y+31,s,1,'rgba(0,0,0,0.06)');
      R(x+31,y,1,s,'rgba(0,0,0,0.04)');

    }else if(type==='forest'){
      // GBA FE-style forest: block-variation ground + varied canopy
      R(x,y,s,s,'#48a040');
      // Block-variation ground (darker forest floor)
      var fg=['#3a9030','#409838','#48a040','#3c9434','#44a03c'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        var fi=Math.floor(rng(by*8+bx)*5);
        R(x+bx*4,y+by*4,4,4,fg[fi]);
      }
      // Per-tile canopy/trunk X offset for variation
      var txOff=Math.floor(rng(200)*4)-1;
      // Ground shadow under canopy
      R(x+2+txOff,y+20,26,10,'rgba(0,30,0,0.25)');
      R(x+4+txOff,y+22,22,6,'rgba(0,20,0,0.15)');
      // Tree trunks (offset per tile)
      R(x+9+txOff,y+18,4,14,'#6a4828');R(x+10+txOff,y+19,2,12,'#7a5838');
      R(x+21+txOff,y+20,3,12,'#6a4828');R(x+22+txOff,y+21,1,10,'#7a5838');
      // Main canopy — deep shadow layer
      ctx.fillStyle='#1a7810';ctx.beginPath();ctx.arc(x+11+txOff,y+15,11,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a7810';ctx.beginPath();ctx.arc(x+22+txOff,y+17,9,0,Math.PI*2);ctx.fill();
      // Mid canopy layer
      ctx.fillStyle='#288a20';ctx.beginPath();ctx.arc(x+11+txOff,y+13,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#309828';ctx.beginPath();ctx.arc(x+22+txOff,y+15,7,0,Math.PI*2);ctx.fill();
      // Highlight canopy (top-lit)
      ctx.fillStyle='#40a838';ctx.beginPath();ctx.arc(x+10+txOff,y+10,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#50b848';ctx.beginPath();ctx.arc(x+9+txOff,y+8,3,0,Math.PI*2);ctx.fill();
      // Sunlit leaf clusters (2×2 instead of single pixels)
      var nlc=2+Math.floor(rng(210)*2);
      for(let i=0;i<nlc;i++){
        var lx=x+6+txOff+Math.floor(rng(211+i)*18),ly=y+6+Math.floor(rng(221+i)*12);
        R(lx,ly,2,2,'#60c850');
      }
      // Dark arc at canopy bottom for depth
      ctx.fillStyle='rgba(0,30,0,0.3)';
      ctx.beginPath();ctx.arc(x+11+txOff,y+18,9,0,Math.PI);ctx.fill();

    }else if(type==='mountain'){
      // GBA FE-style rocky mountain with crack details and scree
      R(x,y,s,s,'#a09880');
      // Base grass zone
      R(x,y+24,s,8,'#58a848');R(x,y+24,s,2,'#80a870');
      // Scree/rubble transition zone between grass and rock
      var screeY=y+22;
      for(let i=0;i<6;i++){
        var sx2=x+2+Math.floor(rng(i+300)*24),sw=2+Math.floor(rng(i+310)*3);
        var sc=rng(i+320)>0.5?'#908870':'#a89878';
        R(sx2,screeY+Math.floor(rng(i+330)*4),sw,2,sc);
      }
      // Main peak — lit right face
      ctx.fillStyle='#b0a890';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+30,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      // Main peak — shadowed left face
      ctx.fillStyle='#807060';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+2,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      // Secondary peak
      ctx.fillStyle='#a09078';ctx.beginPath();ctx.moveTo(x+24,y+6);ctx.lineTo(x+31,y+20);ctx.lineTo(x+18,y+20);ctx.fill();
      ctx.fillStyle='#887060';ctx.beginPath();ctx.moveTo(x+24,y+6);ctx.lineTo(x+18,y+20);ctx.lineTo(x+22,y+20);ctx.fill();
      // Snow caps
      R(x+13,y+1,6,4,'#e8ecf4');R(x+14,y+0,4,2,'#f0f4f8');R(x+22,y+6,4,3,'#dce0e8');
      // Crack lines on rock faces (1px darker shade)
      ctx.strokeStyle='#685848';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+10,y+10);ctx.lineTo(x+13,y+16);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+7,y+14);ctx.lineTo(x+10,y+18);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+20,y+10);ctx.lineTo(x+22,y+15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+26,y+12);ctx.lineTo(x+28,y+17);ctx.stroke();
      // Rock texture details
      R(x+8,y+16,3,1,'#706048');R(x+20,y+12,2,2,'#706048');R(x+17,y+2,1,8,'#b8a888');

    }else if(type==='fort'){
      // GBA-style Fort - central keep with flag
      const stone='#7a8a7a', stoneLight='#9aabaa', stoneDark='#5a6a5a', roof='#8b4513';
      // Stone pavement base
      R(x,y,s,s,stone);
      // Outer wall ring (8px thick)
      R(x+4,y+4,24,24,stoneDark);
      R(x+6,y+6,20,20,stone);
      // Inner courtyard
      R(x+8,y+8,16,16,'#6a7a6a');
      // Central keep (square tower)
      R(x+10,y+10,12,12,stoneLight);
      R(x+12,y+12,8,8,'#5a6a5a');
      // Roof
      R(x+10,y+10,12,3,roof);
      // Flag
      R(x+15,y+4,1,6,'#8b4513');
      R(x+16,y+4,4,3,'#4a9eff');
      // Corner details
      R(x+4,y+4,4,4,stoneLight);
      R(x+24,y+4,4,4,stoneLight);
      R(x+4,y+24,4,4,stoneLight);
      R(x+24,y+24,4,4,stoneLight);

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

    }else if(type==='gate'){
      // Archway with wooden door
      R(x,y,s,s,'#908880'); // stone base
      R(x,y,8,s,'#a09890');R(x+24,y,8,s,'#a09890'); // pillars
      R(x+2,y,3,s,'#b0a8a0');R(x+27,y,3,s,'#b0a8a0'); // pillar highlights
      // Arch
      ctx.fillStyle='#a8a098';ctx.beginPath();ctx.arc(x+16,y+8,10,Math.PI,0);ctx.fill();
      ctx.fillStyle='#685838';ctx.beginPath();ctx.arc(x+16,y+8,8,Math.PI,0);ctx.fill();
      // Wooden door
      R(x+8,y+8,16,24,'#8a6838');R(x+9,y+9,14,22,'#9a7848');
      R(x+15,y+8,2,24,'#705028');R(x+8,y+18,16,2,'#705028');
      // Iron studs and handle
      R(x+10,y+12,2,2,'#c0c0c0');R(x+10,y+22,2,2,'#c0c0c0');
      R(x+20,y+12,2,2,'#c0c0c0');R(x+20,y+22,2,2,'#c0c0c0');
      R(x+21,y+17,2,4,'#d0b060'); // door handle

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

    }else if(type==='village'){
      // GBA FE-style village house on grass
      R(x,y,s,s,'#58b848');
      // Block-variation grass
      var vg=['#50b040','#58b848','#54b444'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,vg[Math.floor(rng(by*8+bx+1100)*3)]);
      }
      // House body
      R(x+4,y+14,24,14,'#e0c898');R(x+5,y+15,22,12,'#ecd8a8');
      // Roof (bright red)
      ctx.fillStyle='#d04030';ctx.beginPath();ctx.moveTo(x+16,y+3);ctx.lineTo(x+31,y+14);ctx.lineTo(x+1,y+14);ctx.fill();
      ctx.fillStyle='#b03028';ctx.beginPath();ctx.moveTo(x+16,y+3);ctx.lineTo(x+1,y+14);ctx.lineTo(x+16,y+14);ctx.fill();
      // Door
      R(x+12,y+20,6,8,'#7a5030');R(x+13,y+21,4,7,'#8a6040');P(x+16,y+24,'#d0b060');
      // Window with warm light
      R(x+21,y+17,5,5,'#405060');R(x+22,y+18,3,3,'#f8e070');
      // Chimney with smoke
      R(x+23,y+3,4,8,'#908070');R(x+22,y+3,6,1,'#a09080');
      P(x+24,y+1,'#c0c0c0');P(x+25,y+0,'#d0d0d0');

    }else if(type==='throne'){
      // Royal carpet + golden seat
      R(x,y,s,s,'#584070');
      // Checkered floor
      for(let py=0;py<s;py+=8)for(let px=0;px<s;px+=8)
        R(x+px,y+py,8,8,((px+py)/8%2)?'#4c3460':'#604880');
      // Royal red carpet
      R(x+4,y+4,24,24,'#c82020');R(x+5,y+5,22,22,'#d83838');
      // Gold border
      R(x+4,y+4,24,1,'#e0b030');R(x+4,y+27,24,1,'#e0b030');R(x+4,y+4,1,24,'#e0b030');R(x+27,y+4,1,24,'#e0b030');
      R(x+5,y+5,22,1,'#c89828');R(x+5,y+26,22,1,'#c89828');
      // Throne back
      R(x+10,y+4,12,6,'#e0b030');R(x+11,y+5,10,4,'#f0c840');
      // Seat
      R(x+9,y+10,14,8,'#e0b030');R(x+10,y+11,12,6,'#d83838');
      // Jewel and armrests
      R(x+14,y+5,4,2,'#ff4040');P(x+15,y+5,'#ff8080');
      R(x+8,y+10,2,7,'#d0a028');R(x+22,y+10,2,7,'#d0a028');

    }else if(type==='pillar'){
      // Marble floor base — matches floor terrain palette
      R(x,y,s,s,'#c8c0b0');
      for(let py=0;py<s;py+=8)for(let px=0;px<s;px+=8){
        var chk=((px+py)/8)%2;
        R(x+px,y+py,8,8,chk?'#c0b8a8':'#d0c8b8');
      }
      for(let gy=8;gy<s;gy+=8){R(x,y+gy,s,1,'#a09888');}
      for(let gx=8;gx<s;gx+=8){R(x+gx,y,1,s,'#a09888');}
      // Column shadow on floor
      R(x+14,y+6,12,24,'rgba(0,0,0,0.12)');
      R(x+15,y+8,11,20,'rgba(0,0,0,0.06)');
      // Column body — cylindrical shading (dark edge → light center → dark edge)
      R(x+10,y+4,12,24,'#9898a8');   // dark left edge
      R(x+11,y+4,10,24,'#b0b0c0');   // mid tone
      R(x+12,y+4,8,24,'#c0c0d0');    // lighter
      R(x+13,y+4,5,24,'#d0d0e0');    // highlight band
      R(x+14,y+5,2,22,'#dddde8');    // bright highlight stripe
      // Fluting lines (subtle vertical grooves)
      R(x+12,y+6,1,20,'#a8a8b8');
      R(x+18,y+6,1,20,'#a8a8b8');
      // Capital (top decorative piece)
      R(x+8,y+2,16,3,'#b8b8c8');R(x+7,y+1,18,2,'#c8c8d8');
      R(x+9,y+3,14,1,'#a0a0b0');
      // Base (bottom wider piece)
      R(x+8,y+27,16,3,'#b8b8c8');R(x+7,y+29,18,2,'#a8a8b8');
      R(x+9,y+27,14,1,'#d0d0e0');

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
      // Rocky cliff with layered shading
      R(x,y,s,s,'#585048');
      // Top grass strip
      R(x,y,s,6,'#58a848');
      R(x,y+5,s,2,'#80a870');
      // Rock face with variation
      var clOff=Math.floor(rng(700)*4);
      R(x+clOff,y+7,s-clOff,23,'#706858');
      R(x+clOff+2,y+9,s-clOff-4,19,'#605848');
      // Horizontal crack lines
      ctx.strokeStyle='#504838';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+clOff+2,y+14);ctx.lineTo(x+clOff+18,y+15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+clOff+6,y+22);ctx.lineTo(x+clOff+22,y+21);ctx.stroke();
      // Rock texture
      for(let i=0;i<3;i++){
        var cx2=x+4+Math.floor(rng(i+710)*22),cy2=y+10+Math.floor(rng(i+720)*16);
        R(cx2,cy2,2,2,rng(i+730)>0.5?'#786858':'#584838');
      }

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
      // Wheel ruts
      R(x+8,y,2,s,'rgba(0,0,0,0.1)');R(x+22,y,2,s,'rgba(0,0,0,0.1)');
      // Scattered pebbles
      for(let i=0;i<3;i++){
        P(x+4+Math.floor(rng(i+790)*24),y+4+Math.floor(rng(i+800)*24),'#a89858');
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

    }else if(type==='ruins'){
      // Overgrown stone ruins on grass
      R(x,y,s,s,'#58b848');
      // Grass variation
      var rg=['#50b040','#58b848','#54b444'];
      for(let by=0;by<8;by++)for(let bx=0;bx<8;bx++){
        R(x+bx*4,y+by*4,4,4,rg[Math.floor(rng(by*8+bx+960)*3)]);
      }
      // Broken stone walls
      var rc=rng(970)>0.5?'#808070':'#707060';
      R(x+6,y+6,20,20,rc);
      R(x+8,y+8,16,16,'#888878');
      // Gaps in walls (grass showing through)
      R(x+12,y+6,8,4,'#58b848');R(x+22,y+14,6,8,'#58b848');
      // Moss on stones
      R(x+7,y+18,3,2,'#507848');R(x+20,y+8,3,2,'#507848');
      // Rubble
      R(x+14,y+22,3,2,'#989888');R(x+10,y+12,2,2,'#a0a090');

    }else if(type==='stairs'){
      // Stone staircase with proper step shading
      R(x,y,s,s,'#c8c0b0');
      for(let i=0;i<4;i++){
        var sy2=y+i*8;
        R(x,sy2,s,8,i%2===0?'#c0b8a8':'#ccc4b4');
        R(x,sy2,s,1,'#d8d0c4');  // step edge highlight
        R(x,sy2+7,s,1,'#a09888');  // step shadow
        // Surface texture
        for(let j=0;j<3;j++){
          P(x+4+Math.floor(rng(i*3+j+980)*22),sy2+2+Math.floor(rng(i*3+j+990)*4),'#b8b0a0');
        }
      }

    }else if(type==='brazier'){
      // Floor tile with iron brazier and fire
      R(x,y,s,s,'#c8c0b0');
      // Floor tile pattern
      for(let py2=0;py2<s;py2+=8)for(let px2=0;px2<s;px2+=8){
        R(x+px2,y+py2,8,8,((px2+py2)/8%2)?'#c0b8a8':'#d0c8b8');
      }
      // Iron brazier bowl
      R(x+10,y+16,12,10,'#404030');R(x+11,y+17,10,8,'#484838');
      R(x+12,y+14,8,4,'#505040');  // rim
      // Brazier legs
      R(x+10,y+26,3,4,'#383028');R(x+19,y+26,3,4,'#383028');
      // Fire glow on floor
      ctx.fillStyle='rgba(255,120,20,0.15)';ctx.beginPath();ctx.arc(x+16,y+18,12,0,Math.PI*2);ctx.fill();
      // Flames
      var flc=rng(1000)>0.5?'#ff6010':'#ff9020';
      ctx.fillStyle=flc;ctx.beginPath();ctx.moveTo(x+14,y+14);ctx.quadraticCurveTo(x+16,y+4,x+18,y+14);ctx.fill();
      ctx.fillStyle='#ffcc30';ctx.beginPath();ctx.moveTo(x+15,y+14);ctx.quadraticCurveTo(x+16,y+8,x+17,y+14);ctx.fill();
      // Embers
      if(rng(1010)>0.4){P(x+12+Math.floor(rng(1011)*8),y+6+Math.floor(rng(1012)*6),'#ff8040');}

    }else{R(x,y,s,s,'#58b848');}
    ctx.strokeStyle='rgba(0,0,0,0.08)';ctx.strokeRect(x+0.5,y+0.5,s-1,s-1);
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
        if (['/classes/', '/characters/'].some(sub => window.location.pathname.includes(sub))) {
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

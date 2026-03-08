// unit-layer.js — DOM-based unit sprite rendering
// Replaces canvas drawUnit with CSS sprite <div> elements for:
//   1. Safari compatibility (CSS filter hue-rotate works, canvas filter doesn't)
//   2. GPU-accelerated CSS transitions for smooth movement
//   3. CSS sprite sheet animation via background-position

const UnitLayer = {
  container: null,   // #unit-layer
  world: null,       // #unit-world
  cursorEl: null,    // #dom-cursor
  unitElements: {},  // Map<unit.id, HTMLElement>
  _tileSize: 64,     // tileSize * scale = 32 * 2
  _active: true,

  init() {
    this.container = document.getElementById('unit-layer');
    this.world = document.getElementById('unit-world');
    this.cursorEl = document.getElementById('dom-cursor');
    if (!this.container || !this.world) {
      this._active = false;
      console.warn('UnitLayer: DOM elements not found, falling back to canvas');
    }
  },

  // Called when a new chapter loads
  setupChapter(units, mapW, mapH) {
    if (!this._active) return;
    this.clearUnits();
    this.world.style.width = (mapW * this._tileSize) + 'px';
    this.world.style.height = (mapH * this._tileSize) + 'px';
    for (var i = 0; i < units.length; i++) {
      if (units[i].hp > 0) this.addUnit(units[i]);
    }
  },

  addUnit(unit) {
    if (!this._active) return;
    if (this.unitElements[unit.id]) return;

    var el = document.createElement('div');
    el.className = 'map-unit';
    el.dataset.unitId = unit.id;

    // HP bar
    var hpBar = document.createElement('div');
    hpBar.className = 'map-unit__hp';
    var hpFill = document.createElement('div');
    hpFill.className = 'map-unit__hp-fill';
    hpBar.appendChild(hpFill);
    el.appendChild(hpBar);

    // Boss indicator
    if (unit.isBoss) {
      var boss = document.createElement('div');
      boss.className = 'map-unit__boss';
      el.appendChild(boss);
    }

    this.world.appendChild(el);
    this.unitElements[unit.id] = el;

    this._setupSprite(unit, el);
    this._positionUnit(unit, el);
  },

  removeUnit(unit) {
    if (!this._active) return;
    var el = this.unitElements[unit.id];
    if (el) {
      el.remove();
      delete this.unitElements[unit.id];
    }
  },

  clearUnits() {
    for (var id in this.unitElements) {
      this.unitElements[id].remove();
    }
    this.unitElements = {};
  },

  // Called every frame from game.render()
  update(game) {
    if (!this._active) return;

    // Sync layer position/size with canvas (handles responsive, fullscreen, etc.)
    var cvs = document.getElementById('gameCanvas');
    var cRect = cvs.getBoundingClientRect();
    var pRect = this.container.parentElement.getBoundingClientRect();
    this.container.style.left = (cRect.left - pRect.left) + 'px';
    this.container.style.top = (cRect.top - pRect.top) + 'px';
    this.container.style.width = cRect.width + 'px';
    this.container.style.height = cRect.height + 'px';

    // Scale world from 800x600 internal coords to displayed size, then apply camera
    var sx = cRect.width / 800;
    var sy = cRect.height / 600;
    this.world.style.transformOrigin = '0 0';
    this.world.style.transform =
      'scale(' + sx + ',' + sy + ') translate(' + (-GameMap.camX) + 'px,' + (-GameMap.camY) + 'px)';

    // Update cursor
    if (this.cursorEl) {
      this.cursorEl.style.left = (Cursor.x * this._tileSize) + 'px';
      this.cursorEl.style.top = (Cursor.y * this._tileSize) + 'px';
    }

    // Update each unit
    var units = game.units;
    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      if (unit.hp <= 0) {
        // Remove dead units
        if (this.unitElements[unit.id]) this.removeUnit(unit);
        continue;
      }
      var el = this.unitElements[unit.id];
      if (!el) {
        // Unit appeared (recruited mid-chapter, etc.)
        this.addUnit(unit);
        el = this.unitElements[unit.id];
        if (!el) continue;
      }

      // Get sprite info
      var info = this._getFrameInfo(unit);
      if (!info.spriteKey) {
        // No sprite — hide DOM element, canvas fallback will draw it
        el.style.display = 'none';
        continue;
      }

      // Check sprite loaded
      var sData = Sprites._imgCache && Sprites._imgCache[info.spriteKey];
      if (!sData || !sData.loaded || sData.error) {
        el.style.display = 'none';
        continue;
      }
      el.style.display = '';

      // Update sprite background if changed
      if (el.dataset.sKey !== info.spriteKey) {
        this._setupSprite(unit, el, info);
      }

      // Update frame
      var frameH = parseFloat(el.dataset.frameH) || 0;
      el.style.backgroundPositionY = -(info.frame * frameH) + 'px';

      // Flip
      if (info.flipX) {
        el.classList.add('map-unit--flip');
      } else {
        el.classList.remove('map-unit--flip');
      }

      // Faction tinting / grayed
      var showGray = unit.acted && (
        (unit.faction === 'player' && game.phase === 'player') ||
        (unit.faction === 'enemy' && game.phase === 'enemy')
      );
      el.classList.toggle('map-unit--grayed', showGray);
      el.classList.toggle('map-unit--enemy', !showGray && unit.faction === 'enemy');
      el.classList.toggle('map-unit--ally', !showGray && unit.faction === 'ally');

      // HP bar
      this._updateHP(unit, el);
    }
  },

  // Returns true if this unit has a loaded DOM sprite
  hasSpriteFor(unit) {
    if (!this._active) return false;
    var el = this.unitElements[unit.id];
    return el && el.style.display !== 'none';
  },

  // Position a unit at its grid coordinates (world space)
  _positionUnit(unit, el) {
    el.style.left = (unit.x * this._tileSize) + 'px';
    el.style.top = (unit.y * this._tileSize) + 'px';
  },

  // Set up sprite background image and dimensions
  _setupSprite(unit, el, info) {
    if (!info) info = this._getFrameInfo(unit);
    var sKey = info.spriteKey;
    if (!sKey) { el.style.display = 'none'; return; }

    var sData = Sprites._imgCache && Sprites._imgCache[sKey];
    if (!sData || !sData.loaded || sData.error) { el.style.display = 'none'; return; }

    var totalFrames = info.isWalkSheet ? 15 : 3;
    var sw = sData.img.naturalWidth || sData.img.width;
    var sh = (sData.img.naturalHeight || sData.img.height) / totalFrames;

    // Drawing dimensions: sw * 1.5 * scale (canvas had ctx.scale(2,2) applied)
    var scale = GameMap.scale || 2;
    var drawW = sw * 1.5 * scale;
    var drawH = sh * 1.5 * scale;
    var frameH = sh * 1.5 * scale;

    el.style.width = drawW + 'px';
    el.style.height = drawH + 'px';
    el.style.backgroundImage = 'url(assets/sprites/map/' + sKey + ')';
    el.style.backgroundSize = drawW + 'px auto';

    // Offset within tile: centered horizontally, bottom-aligned
    // Original canvas: dx = (TILE_SIZE - drawW_unscaled)/2, dy = (TILE_SIZE - drawH_unscaled) - 4
    // All scaled by GameMap.scale for the 64px tile space
    var offsetX = (this._tileSize - drawW) / 2;
    var offsetY = (this._tileSize - drawH) - 4 * scale;
    el.style.marginLeft = offsetX + 'px';
    el.style.marginTop = offsetY + 'px';

    el.dataset.sKey = sKey;
    el.dataset.frameH = frameH;
  },

  // Replicate frame selection logic from Sprites.drawUnit
  _getFrameInfo(unit) {
    var cls = unit.classId || 'soldier';
    var classDef = typeof getClassData === 'function' ? getClassData(cls) : (CLASSES[cls] || CLASSES.soldier);
    if (!classDef || !classDef.sprites) {
      return { frame: 0, spriteKey: '', flipX: false, isWalkSheet: false };
    }

    var isSelected = !!unit._selected;
    var hasDirection = !!unit._direction;
    var isMoving = !!(unit.vx || unit.vy);
    var useWalkSprites = isSelected || hasDirection || isMoving;
    var gender = unit.gender || 'm';

    // Gender fallback logic
    var sKey;
    if (gender === 'f') {
      sKey = useWalkSprites
        ? (classDef.sprites.walk_f || classDef.sprites.move_f || classDef.sprites.walk_m || classDef.sprites.move_m || '')
        : (classDef.sprites.stand_f || classDef.sprites.stand_m || '');
    } else {
      sKey = useWalkSprites
        ? (classDef.sprites.walk_m || classDef.sprites.move_m || classDef.sprites.walk_f || classDef.sprites.move_f || '')
        : (classDef.sprites.stand_m || classDef.sprites.stand_f || '');
    }

    if (!sKey) return { frame: 0, spriteKey: '', flipX: false, isWalkSheet: false };

    var isWalkSheet = useWalkSprites && (sKey.indexOf('walk') !== -1 || sKey.indexOf('move') !== -1);
    var spd = unit.spd || 10;
    var animSpeed = Math.max(4, Math.min(16, 8 + (spd - 10) / 2));
    var frame = 0;
    var flipX = false;

    if (isWalkSheet) {
      var showDirectional = isMoving || hasDirection;
      if (unit._selected && !showDirectional) {
        // Selected idle: frames 12-14
        frame = 12 + Math.floor(Sprites._frameCounter / animSpeed) % 3;
      } else {
        var direction = unit._direction;
        if (!direction && isMoving) {
          if (unit.vx > 0) direction = 'right';
          else if (unit.vx < 0) direction = 'left';
          else if (unit.vy > 0) direction = 'down';
          else if (unit.vy < 0) direction = 'up';
        }
        direction = direction || 'down';

        var baseFrame;
        if (direction === 'left') {
          baseFrame = 0;
        } else if (direction === 'right') {
          baseFrame = 0;
          flipX = true;
        } else if (direction === 'down') {
          baseFrame = 4;
        } else if (direction === 'up') {
          baseFrame = 8;
        } else {
          baseFrame = 4;
        }
        frame = baseFrame + Math.floor(Sprites._frameCounter / animSpeed) % 4;
      }
    } else {
      // Stand idle frames
      frame = Sprites._idleFrame();
    }

    return { frame: frame, spriteKey: sKey, flipX: flipX, isWalkSheet: isWalkSheet };
  },

  // Update HP bar
  _updateHP(unit, el) {
    var hpFill = el.querySelector('.map-unit__hp-fill');
    if (!hpFill) return;
    if (unit.hp === undefined || !unit.maxHp) return;
    var ratio = unit.hp / unit.maxHp;
    hpFill.style.width = Math.floor(24 * ratio) + 'px';
    // Color
    if (ratio > 0.5) {
      hpFill.className = 'map-unit__hp-fill';
    } else if (ratio > 0.25) {
      hpFill.className = 'map-unit__hp-fill map-unit__hp-fill--med';
    } else {
      hpFill.className = 'map-unit__hp-fill map-unit__hp-fill--low';
    }
  },

  // Movement transition methods
  startMoveTransition(unit, tileDuration) {
    if (!this._active) return;
    var el = this.unitElements[unit.id];
    if (el) {
      el.style.transition = 'left ' + tileDuration + 'ms linear, top ' + tileDuration + 'ms linear';
    }
  },

  moveUnitTo(unit, x, y) {
    if (!this._active) return;
    var el = this.unitElements[unit.id];
    if (el) {
      el.style.left = (x * this._tileSize) + 'px';
      el.style.top = (y * this._tileSize) + 'px';
    }
  },

  endMoveTransition(unit) {
    if (!this._active) return;
    var el = this.unitElements[unit.id];
    if (el) {
      el.style.transition = 'none';
    }
  },

  // Visibility controls
  setVisible(visible) {
    if (!this._active) return;
    this.container.style.display = visible ? '' : 'none';
  },

  showCursor(visible) {
    if (!this._active || !this.cursorEl) return;
    this.cursorEl.style.display = visible ? 'block' : 'none';
  },
};

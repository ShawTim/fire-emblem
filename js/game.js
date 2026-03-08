// game.js — Core game state machine

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvasW = canvas.width;
    this.canvasH = canvas.height;
    this.state = 'title';
    this.units = [];
    this.playerRoster = [];
    this.currentChapter = 0;
    this.chapterData = null;
    this.turn = 1;
    this.phase = 'player';
    this.selectedUnit = null;
    this.moveRange = [];
    this.attackRange = [];
    this.attackTargets = [];
    this.healTargets = [];
    this.lastTimestamp = 0;
    this.dialogue = new DialogueSystem();
    this.enemyActions = [];
    this.enemyActionIndex = 0;
    this.combatResult = null;
    this.combatStepIndex = 0;
    this.combatStepTimer = 0;
    this.prevUnitPos = null;
    this.battleScene = new BattleScene();
  }

  init() {
    // Preload portraits and map sprites
    Sprites.preloadPortraits();
    
    // Show loading screen while preloading sprites
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'sprite-loading';
    loadingDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#0a0a1a;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#4a9eff;font-family:inherit;';
    loadingDiv.innerHTML = '<div style="font-size:24px;margin-bottom:20px;">載入資源中...</div><div id="loading-progress" style="font-size:16px;color:#88a;">0%</div>';
    document.body.appendChild(loadingDiv);
    
    Sprites.preloadMapSprites(
      (loaded, total) => {
        const pct = Math.round((loaded / total) * 100);
        const progressDiv = document.getElementById('loading-progress');
        if (progressDiv) progressDiv.textContent = pct + '%';
      },
      () => {
        // Remove loading screen when done
        const loading = document.getElementById('sprite-loading');
        if (loading) loading.remove();
        
        const hasSave = GameSave.exists();
        UI.showTitleScreen(hasSave);
        this.state = 'title';
        BGM.play('title', true);
      }
    );
  }

  startNewGame() {
    this.playerRoster = [];
    this.currentChapter = 0;
    UI.hideTitleScreen();
    UI.clearOverlays();
    this.startChapter(0).catch(console.error);
  }

  continueGame() {
    if (GameSave.load(this)) {
      UI.hideTitleScreen();
      UI.clearOverlays();
      this.startChapter(this.currentChapter).catch(console.error);
    } else {
      this.startNewGame();
    }
  }


  async startChapter(id) {
    const chapter = await getChapter(id);
    if (!chapter) {
      this.state = 'ending';
      UI.showEnding();
      return;
    }
    // Check for prologue and play it first
    if (chapter.prologue) {
      await PrologueDisplay.show(chapter.prologue);
    }
    this.chapterData = chapter;
    this.currentChapter = id;
    this.turn = 1;
    this.phase = 'player';
    this.units = [];
    this.state = 'chapterTitle';

    GameMap.init(chapter);

    // Place player units
    for (const pu of chapter.playerUnits) {
      const charData = CHARACTERS[pu.charId];
      if (!charData) continue;
      let unit = this.playerRoster.find(u => u.charId === pu.charId);
      if (unit) {
        unit.x = pu.x;
        unit.y = pu.y;
        unit.hp = unit.maxHp;
        unit.acted = false;
        unit.moved = false;
        unit.faction = 'player';
      } else {
        unit = new Unit({
          charId: pu.charId, name: charData.name, classId: charData.classId,
          level: charData.level || 1, faction: 'player', x: pu.x, y: pu.y,
          isLord: charData.isLord || false, portrait: charData.portrait,
          growths: charData.growths || {}, baseStats: charData.baseStats, items: charData.items,
          gender: charData.gender || 'm',
        });
        this.playerRoster.push(unit);
      }
      this.units.push(unit);
    }

    // Place enemies
    for (const ed of chapter.enemies) {
      const unit = new Unit({
        name: ed.name || '敵兵', classId: ed.classId, level: ed.level || 1,
        faction: 'enemy', x: ed.x, y: ed.y, ai: ed.ai || 'aggressive',
        isBoss: ed.isBoss || false, isCain: ed.isCain || false,
        recruitableBy: ed.recruitableBy || null, bonusStats: ed.bonusStats || null,
        portrait: ed.portrait || null, items: ed.items,
        baseStats: this.generateEnemyStats(ed.classId, ed.level),
      });
      this.units.push(unit);
    }

    // Center camera
    if (chapter.playerUnits.length > 0) {
      const pu = chapter.playerUnits[0];
      GameMap.centerOn(pu.x, pu.y, this.canvasW, this.canvasH);
      Cursor.moveTo(pu.x, pu.y);
    }

    // Initialize DOM unit layer
    UnitLayer.setupChapter(this.units, GameMap.width, GameMap.height);

    UI.showChapterCard(chapter.title, chapter.subtitle, () => {
      if (chapter.dialogues && chapter.dialogues.pre) {
        this.state = 'dialogue';
        BGM.play('dialogue', true);
        this.dialogue.start(chapter.dialogues.pre, () => {
          this.beginPlayerPhase();
        });
      } else {
        this.beginPlayerPhase();
      }
    });
  }

  generateEnemyStats(classId, level) {
    const cls = getClassData(classId);
    const isMagic = cls.weapons.some(w => ['fire','thunder','wind','dark','staff'].includes(w));
    return {
      hp: 16 + level * 2,
      str: isMagic ? 1 : 3 + level,
      mag: isMagic ? 3 + level : 0,
      skl: 2 + level,
      spd: 2 + level,
      lck: 1 + Math.floor(level / 2),
      def: 2 + level,
      res: 1 + Math.floor(level / 2),
    };
  }

  beginPlayerPhase() {
    this.phase = 'player';
    this.state = 'map';
    this.selectedUnit = null;
    for (const u of this.units) {
      if (u.faction === 'player' && u.hp > 0) u.reset();
    }
    this.processTurnEvents();
    UI.updateTopBar(this.chapterData.title + '：' + this.chapterData.subtitle, this.turn, 'player', this.chapterData.objective);
    UI.showPhaseBanner('player');
    UI.hideActionMenu();
    UI.hideCombatForecast();
    BGM.play('playerPhase', true);
    this.applyTerrainHealing('player');
    UI.showEndTurnButton(() => this.endTurn());
  }

  applyTerrainHealing(faction) {
    let hasHealed = false;
    for (const u of this.units) {
      if (u.faction === faction && u.hp > 0 && u.hp < u.maxHp) {
        const terrain = GameMap.getTerrain(u.x, u.y);
        if (terrain === 'fort' || terrain === 'gate' || terrain === 'throne') {
          const healAmt = Math.min(u.maxHp - u.hp, Math.floor(u.maxHp * 0.2));
          if (healAmt > 0) {
            u.hp += healAmt;
            // Delay slightly to ensure UI is ready, and sequence them visually
            setTimeout(() => {
              const ts = GameMap.tileSize * GameMap.scale;
              const sx = u.x * ts - GameMap.camX + ts / 2;
              const sy = u.y * ts - GameMap.camY;
              UI.showDamagePopup(sx, sy, healAmt, 'heal');
              if (typeof SFX !== 'undefined' && !hasHealed) {
                SFX.heal();
                hasHealed = true;
              }
            }, 500);
          }
        }
      }
    }
  }

  processTurnEvents() {
    if (!this.chapterData.turnEvents) return;
    for (const evt of this.chapterData.turnEvents) {
      if (evt.turn !== this.turn) continue;
      if (evt.type === 'recruit' && this.chapterData.newRecruits) {
        for (const nr of this.chapterData.newRecruits) {
          if (nr.turnJoin !== this.turn) continue;
          if (this.units.find(u => u.charId === nr.charId && u.hp > 0)) continue;
          const charData = CHARACTERS[nr.charId];
          if (!charData) continue;
          let unit = this.playerRoster.find(u => u.charId === nr.charId);
          if (!unit) {
            unit = new Unit({
              charId: nr.charId, name: charData.name, classId: charData.classId,
              level: charData.level || 1, faction: 'player', x: nr.x, y: nr.y,
              isLord: charData.isLord || false, portrait: charData.portrait,
              growths: charData.growths || {}, baseStats: charData.baseStats, items: charData.items,
              gender: charData.gender || 'm',
            });
            this.playerRoster.push(unit);
          } else {
            unit.x = nr.x; unit.y = nr.y; unit.hp = unit.maxHp;
            unit.faction = 'player'; unit.acted = false; unit.moved = false;
          }
          this.units.push(unit);
        }
        if (evt.text) {
          const prevState = this.state;
          this.state = 'dialogue';
          this.dialogue.start(evt.text, () => { this.state = prevState; });
        }
      } else if (evt.type === 'reinforce') {
        for (const ed of (evt.enemies || [])) {
          const unit = new Unit({
            name: ed.name || '敵兵', classId: ed.classId, level: ed.level || 1,
            faction: 'enemy', x: ed.x, y: ed.y, ai: ed.ai || 'aggressive',
            isBoss: ed.isBoss || false, items: ed.items,
            baseStats: this.generateEnemyStats(ed.classId, ed.level),
          });
          this.units.push(unit);
        }
      }
    }
  }

  update(timestamp) {
    const dt = this.lastTimestamp ? timestamp - this.lastTimestamp : 16;
    this.lastTimestamp = timestamp;
    Cursor.update(dt);
    this.dialogue.update(dt);
    this.battleScene.update(dt);
    // Note: finishCombat is called via battleScene.onComplete callback
    // Do NOT call it again from update() to avoid double execution

    if (this.state === 'animating') {
      // Movement animation in progress — handled by animateMove
    }
  }

  render(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    if (this.state === 'title' || this.state === 'ending' || this.state === 'chapterTitle') return;

    GameMap.render(ctx, this.canvasW, this.canvasH, Cursor.frame);

    // Seize marker
    if (this.chapterData && this.chapterData.seizePos) {
      const sp = this.chapterData.seizePos;
      const ts = GameMap.tileSize * GameMap.scale;
      const sx = sp.x * ts - GameMap.camX;
      const sy = sp.y * ts - GameMap.camY;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(GameMap.scale, GameMap.scale);
      Sprites.drawSeizeMarker(ctx, 0, 0, Cursor.frame);
      ctx.restore();
    }

    // Overlays
    if (this.moveRange.length > 0) {
      GameMap.renderOverlay(ctx, this.moveRange, 'rgba(0,100,255,0.3)', this.canvasW, this.canvasH, true);
    }
    if (this.attackRange.length > 0) {
      GameMap.renderOverlay(ctx, this.attackRange, 'rgba(255,50,50,0.3)', this.canvasW, this.canvasH, false);
    }

    // Grid overlay
    GameMap.renderGrid(ctx, this.canvasW, this.canvasH);

    // Units — DOM layer handles sprite-based units
    if (UnitLayer._active) {
      UnitLayer.update(this);
      UnitLayer.showCursor(['map', 'unitSelected', 'unitCommand', 'selectTarget', 'mapBrowse'].includes(this.state));
      // Canvas fallback for units without sprite data
      var fallbackUnits = this.units.filter(u => u.hp > 0 && !UnitLayer.hasSpriteFor(u));
      if (fallbackUnits.length > 0) {
        GameMap.renderUnits(ctx, fallbackUnits, this.canvasW, this.canvasH, this);
      }
    } else {
      GameMap.renderUnits(ctx, this.units.filter(u => u.hp > 0), this.canvasW, this.canvasH, this);
      if (['map', 'unitSelected', 'unitCommand', 'selectTarget', 'mapBrowse'].includes(this.state)) {
        Cursor.render(ctx, this.canvasW, this.canvasH);
      }
    }

    // Battle scene
    if (this.battleScene.isActive()) {
      UI.hideUnitPanel();
      UnitLayer.setVisible(false);
      this.battleScene.render(ctx, this.canvasW, this.canvasH);
    } else if (UnitLayer._active) {
      UnitLayer.setVisible(true);
    }
  }

  handleHover(screenX, screenY) {
    if (this.state !== 'map' && this.state !== 'unitSelected' && this.state !== 'unitCommand') return;
    const tile = GameMap.screenToTile(screenX, screenY);
    if (!tile) return;
    Cursor.moveTo(tile.x, tile.y);
    const terrain = GameMap.getTerrain(tile.x, tile.y);
    const unit = this.units.find(u => u.x === tile.x && u.y === tile.y && u.hp > 0);
    UI.showTerrainInfo(terrain, unit);
    if (unit) UI.showUnitPanel(unit, terrain);
    else if (this.state === 'map') UI.hideUnitPanel();
  }

  handleClick(screenX, screenY) {
    if (this.dialogue.isActive()) { this.dialogue.advance(); return; }
    if (this.state === 'title' || this.state === 'ending' || this.state === 'chapterTitle' ||
        this.state === 'combatAnim' || this.state === 'enemyPhase' || this.state === 'gameOver' ||
        this.state === 'mapMenu' || this.state === 'mapBrowse') return;

    const tile = GameMap.screenToTile(screenX, screenY);
    Cursor.moveTo(tile.x, tile.y);
    GameMap.scrollToward(tile.x, tile.y, this.canvasW, this.canvasH);

    if (this.state === 'map') {
      this.onMapClick(tile.x, tile.y, screenX, screenY);
    } else if (this.state === 'unitCommand' || this.state === 'equipMenu' || this.state === 'itemMenu') {
      // Click outside menu — close and cancel
      UI.hideActionMenu();
      this.cancelSelection();
      return;
    } else if (this.state === 'unitSelected') {
      this.onUnitSelectedClick(tile.x, tile.y, screenX, screenY);
    } else if (this.state === 'selectTarget') {
      this.onSelectTargetClick(tile.x, tile.y);
    }
  }

  onMapClick(x, y, screenX, screenY) {
    if (this.phase !== 'player') return;
    
    // Clear previous selection
    if (this.selectedUnit) {
      this.selectedUnit._selected = false;
    }
    
    const unit = this.units.find(u => u.x === x && u.y === y && u.hp > 0);
    if (unit && unit.faction === 'player' && !unit.acted) {
      this.selectedUnit = unit;
      unit._selected = true;  // Mark as selected for sprite rendering
      UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
      this.showUnitCommandMenu(unit);
    } else if (unit && unit.faction === 'enemy') {
      // Show enemy status screen
      UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
      UI.showStatusScreen(unit, null);
    } else if (unit) {
      UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
    } else {
      // 點擊空格（無單位格）觸發地圖選單
      UI.hideUnitPanel();
      if (this.selectedUnit) {
        this.selectedUnit._selected = false;
        this.selectedUnit._direction = null; // Clear facing direction
      }
      this.selectedUnit = null;
      if (this.state === 'map') {
        this.openMapMenu();
      }
    }
  }

  // 取得相鄰友方單位（用於交換系統）
  getAdjacentFriendlyUnits(unit) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    return dirs
      .map(([dx, dy]) => this.units.find(u =>
        u.x === unit.x + dx && u.y === unit.y + dy &&
        u.hp > 0 && u.faction === 'player' && u !== unit
      ))
      .filter(Boolean);
  }

  getMenuPosForUnit(unit, itemCount = 4) {
    const ts = GameMap.tileSize * GameMap.scale;
    let mx = unit.x * ts - GameMap.camX + ts + 8;
    let my = unit.y * ts - GameMap.camY;
    // Keep menu on screen (use viewport height for mobile fullscreen support)
    const viewportH = window.innerHeight || this.canvasH;
    const mobileBuffer = 60;
    const menuHeight = itemCount * 32 + 20; // estimate menu height
    if (mx > this.canvasW - 130) mx = unit.x * ts - GameMap.camX - 130;
    if (my > viewportH - menuHeight - mobileBuffer) my = viewportH - menuHeight - mobileBuffer;
    if (mx < 4) mx = 4;
    if (my < 32) my = 32;
    return { x: mx, y: my };
  }

  showUnitCommandMenu(unit) {
    const items = [];
    items.push({ label: '移動', action: 'cmd_move' });
    if (unit.canAttack()) {
      items.push({ label: '攻擊', action: 'cmd_attack' });
    }
    if (unit.canHeal()) {
      items.push({ label: '治療', action: 'cmd_heal' });
    }
    const cmdWeapons = unit.items.filter(it => it.type !== 'consumable' && it.type !== 'staff' && it.usesLeft > 0);
    if (cmdWeapons.length > 0) {
      items.push({ label: '裝備', action: 'cmd_equip' });
    }
    items.push({ label: '道具', action: 'cmd_item' });
    items.push({ label: '狀態', action: 'cmd_status' });

    // Talk check
    if (this.chapterData.talkEvents) {
      for (const evt of this.chapterData.talkEvents) {
        if (evt.from === unit.charId) {
          const target = this.units.find(u => {
            if (u.hp <= 0) return false;
            if ((u.isCain || u.recruitableBy) && (evt.target === 'cain' || evt.target === u.charId)) {
              return Math.abs(unit.x - u.x) + Math.abs(unit.y - u.y) <= 1;
            }
            return false;
          });
          if (target) items.push({ label: '對話', action: 'cmd_talk', target, event: evt });
        }
      }
    }

    // Seize check
    if (unit.isLord && this.chapterData.seizePos) {
      const sp = this.chapterData.seizePos;
      if (unit.x === sp.x && unit.y === sp.y) {
        items.push({ label: '制壓', action: 'cmd_seize' });
      }
    }

    items.push({ label: '待機', action: 'cmd_wait' });
    items.push({ label: '取消', action: 'cmd_cancel' });

    this.state = 'unitCommand';
    const pos = this.getMenuPosForUnit(unit);
    UI.showActionMenu(items, pos.x, pos.y, (action, idx) => this.onUnitCommandSelect(action, items[idx]));
  }

  onUnitCommandSelect(action, menuItem) {
    UI.hideActionMenu();
    const unit = this.selectedUnit;
    if (!unit) { this.cancelSelection(); return; }

    switch (action) {
      case 'cmd_move':
        this.moveRange = getMovementRange(unit, GameMap.terrain, this.units, GameMap.width, GameMap.height);
        this.attackRange = getAttackTilesFromPositions(this.moveRange, unit, GameMap.width, GameMap.height);
        this.state = 'unitSelected';
        break;

      case 'cmd_attack': {
        // Attack from current position (no move)
        const atkRange = unit.getAttackRange();
        const targets = this.units.filter(u => {
          if (u.faction === 'player' || u.hp <= 0) return false;
          const dist = Math.abs(unit.x - u.x) + Math.abs(unit.y - u.y);
          return atkRange.includes(dist);
        });
        if (targets.length > 0) {
          this.attackTargets = targets;
          this.attackRange = targets.map(t => ({ x: t.x, y: t.y }));
          this.state = 'selectTarget';
        } else {
          // No targets in range — show move first
          this.moveRange = getMovementRange(unit, GameMap.terrain, this.units, GameMap.width, GameMap.height);
          this.attackRange = getAttackTilesFromPositions(this.moveRange, unit, GameMap.width, GameMap.height);
          this.state = 'unitSelected';
        }
        break;
      }

      case 'cmd_heal': {
        const staff = unit.getHealStaff();
        if (staff) {
          const hTargets = this.units.filter(u => {
            if (u.faction !== 'player' || u.hp <= 0 || u.hp >= u.maxHp) return false;
            const dist = Math.abs(unit.x - u.x) + Math.abs(unit.y - u.y);
            return staff.range.includes(dist);
          });
          if (hTargets.length > 0) {
            this.healTargets = hTargets;
            this.attackRange = hTargets.map(u => ({ x: u.x, y: u.y }));
            this.state = 'selectTarget';
          }
        }
        break;
      }

      case 'cmd_equip':
        this.showEquipMenu(unit);
        break;

      case 'cmd_item':
        this.showItemMenu(unit);
        break;

      case 'cmd_status':
        UI.showStatusScreen(unit, () => {
          // Re-open command menu after status screen closes
          if (this.selectedUnit) this.showUnitCommandMenu(this.selectedUnit);
        });
        break;

      case 'cmd_talk':
        this.doTalk(menuItem.target, menuItem.event);
        break;

      case 'cmd_seize':
        this.doSeize();
        break;

      case 'cmd_wait':
        this.doWait();
        break;

      case 'cmd_cancel':
        this.cancelSelection();
        break;
    }
  }

  showEquipMenu(unit) {
    const weapons = unit.items.filter(it => it.type !== 'consumable' && it.type !== 'staff' && it.usesLeft > 0);
    if (weapons.length === 0) {
      // No weapons — return to command menu
      this.showUnitCommandMenu(unit);
      return;
    }
    const items = weapons.map((w, i) => ({
      label: w.name + ' (' + w.usesLeft + '/' + w.uses + ')',
      action: 'equip_' + i,
      weaponIndex: i,
    }));
    items.push({ label: '返回', action: 'equip_cancel' });

    this.state = 'equipMenu';
    const pos = this.getMenuPosForUnit(unit);
    UI.showActionMenu(items, pos.x, pos.y, (action, idx) => {
      UI.hideActionMenu();
      if (action === 'equip_cancel') {
        this.showUnitCommandMenu(unit);
        return;
      }
      // Move selected weapon to front of items array
      const wi = items[idx].weaponIndex;
      const weapon = weapons[wi];
      const origIdx = unit.items.indexOf(weapon);
      if (origIdx > 0) {
        unit.items.splice(origIdx, 1);
        unit.items.unshift(weapon);
      }
      UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
      this.showUnitCommandMenu(unit);
    });
  }

  showItemMenu(unit, onReturn) {
    const backFn = onReturn || (() => this.showUnitCommandMenu(unit));
    if (unit.items.length === 0) {
      backFn();
      return;
    }
    const consumables = unit.items.filter(it => it.type === 'consumable' && it.usesLeft > 0);
    if (consumables.length === 0) {
      backFn();
      return;
    }
    const menuItems = consumables.map((it, i) => ({
      label: it.name + (it.heals ? ` [回復${it.heals}HP]` : '') + ' (' + (it.usesLeft || 0) + '/' + (it.uses || 0) + ')',
      action: 'item_' + i,
      itemRef: it,
    }));
    menuItems.push({ label: '返回', action: 'item_cancel' });

    this.state = 'itemMenu';
    const pos = this.getMenuPosForUnit(unit);
    UI.showActionMenu(menuItems, pos.x, pos.y, (action, idx) => {
      UI.hideActionMenu();
      if (action === 'item_cancel') {
        backFn();
        return;
      }
      const item = menuItems[idx].itemRef;
      if (!item) { backFn(); return; }
      // Use consumable (傷藥 / vulnerary etc)
      if (item.type === 'consumable' && item.heals) {
        if (unit.hp < unit.maxHp) {
          const healAmt = Math.min(item.heals, unit.maxHp - unit.hp);
          unit.hp += healAmt;
          item.usesLeft--;
          if (item.usesLeft <= 0) {
            const realIdx = unit.items.indexOf(item);
            if (realIdx >= 0) unit.items.splice(realIdx, 1);
          }
          const ts = GameMap.tileSize * GameMap.scale;
          const sx = unit.x * ts - GameMap.camX + ts / 2;
          const sy = unit.y * ts - GameMap.camY;
          UI.showDamagePopup(sx, sy, healAmt, 'heal');
          if (typeof SFX !== 'undefined') SFX.heal();
          UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
          // Using item counts as action
          unit.acted = true;
          unit.moved = true;
          if (this.selectedUnit) {
            this.selectedUnit._selected = false;
            this.selectedUnit._direction = null; // Clear facing direction
          }
          this.selectedUnit = null;
          this.state = 'map';
          return;
        } else {
          // Already at full HP, go back to menu
          backFn();
          return;
        }
      }
      backFn();
    });
  }

  animateMove(unit, path, onDone) {
    if (!path || path.length <= 1) { if (onDone) onDone(); return; }
    if (this.state !== 'enemyPhase') this.state = 'animating';
    let step = 1;

    // Movement speed based on unit's spd stat
    // Base: 150ms per tile, faster units move quicker
    const baseSpeed = 150;
    const spd = unit.spd || 10;
    const tileDuration = Math.max(80, baseSpeed - (spd - 10) * 4);

    // Helper to determine direction from path delta
    const getDirection = (from, to) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      if (dx > 0) return 'right';
      if (dx < 0) return 'left';
      if (dy > 0) return 'down';
      if (dy < 0) return 'up';
      return unit._direction || 'down';
    };

    // Enable CSS transition for smooth movement
    UnitLayer.startMoveTransition(unit, tileDuration);

    const advance = () => {
      if (step >= path.length) {
        // Keep _direction for facing after movement
        UnitLayer.endMoveTransition(unit);
        if (onDone) onDone();
        return;
      }
      // Set direction before moving
      unit._direction = getDirection(path[step - 1], path[step]);
      unit.x = path[step].x;
      unit.y = path[step].y;
      // Update DOM position (CSS transition handles interpolation)
      UnitLayer.moveUnitTo(unit, unit.x, unit.y);
      GameMap.scrollToward(unit.x, unit.y, this.canvasW, this.canvasH);
      step++;
      setTimeout(advance, tileDuration);
    };
    advance();
  }

  onUnitSelectedClick(x, y, screenX, screenY) {
    const inRange = this.moveRange.find(t => t.x === x && t.y === y);
    if (inRange) {
      this.prevUnitPos = { x: this.selectedUnit.x, y: this.selectedUnit.y };
      const path = findPath(this.selectedUnit.x, this.selectedUnit.y, x, y,
        this.selectedUnit, GameMap.terrain, this.units, GameMap.width, GameMap.height);
      this.moveRange = [];
      this.attackRange = [];
      if (!path || path.length <= 1) {
        // Direct placement if path is trivial
        this.selectedUnit.x = x;
        this.selectedUnit.y = y;
        this.selectedUnit.moved = true;
        this.state = 'unitMoved';
        this.showActionMenuForUnit(this.selectedUnit, screenX, screenY);
      } else {
        this.animateMove(this.selectedUnit, path, () => {
          this.selectedUnit.moved = true;
          this.state = 'unitMoved';
          this.showActionMenuForUnit(this.selectedUnit, screenX, screenY);
        });
      }
    } else {
      this.cancelSelection();
    }
  }

  showActionMenuForUnit(unit, screenX, screenY) {
    const items = [];
    const atkRange = unit.getAttackRange();

    if (unit.canAttack()) {
      const targets = this.units.filter(u => {
        if (u.faction === 'player' || u.hp <= 0) return false;
        const dist = Math.abs(unit.x - u.x) + Math.abs(unit.y - u.y);
        return atkRange.includes(dist);
      });
      items.push({ label: '攻擊', action: 'attack', disabled: targets.length === 0 });
      this.attackTargets = targets;
    }

    if (unit.canHeal()) {
      const staff = unit.getHealStaff();
      const hTargets = this.units.filter(u => {
        if (u.faction !== 'player' || u.hp <= 0 || u.hp >= u.maxHp) return false;
        const dist = Math.abs(unit.x - u.x) + Math.abs(unit.y - u.y);
        return staff.range.includes(dist);
      });
      items.push({ label: '治療', action: 'heal', disabled: hTargets.length === 0 });
      this.healTargets = hTargets;
    }

    if (this.chapterData.talkEvents) {
      for (const evt of this.chapterData.talkEvents) {
        if (evt.from === unit.charId) {
          const target = this.units.find(u => {
            if (u.hp <= 0) return false;
            if ((u.isCain || u.recruitableBy) && (evt.target === 'cain' || evt.target === u.charId)) {
              return Math.abs(unit.x - u.x) + Math.abs(unit.y - u.y) <= 1;
            }
            return false;
          });
          if (target) items.push({ label: '對話', action: 'talk', target, event: evt });
        }
      }
    }

    if (unit.isLord && this.chapterData.seizePos) {
      const sp = this.chapterData.seizePos;
      if (unit.x === sp.x && unit.y === sp.y) {
        items.push({ label: '制壓', action: 'seize' });
      }
    }

    const postMoveWeapons = unit.items.filter(it => it.type !== 'consumable' && it.type !== 'staff' && it.usesLeft > 0);
    if (postMoveWeapons.length > 0) {
      items.push({ label: '裝備', action: 'equip' });
    }
    const postMoveConsumables = unit.items.filter(it => it.type === 'consumable' && it.usesLeft > 0);
    if (postMoveConsumables.length > 0) {
      items.push({ label: '道具', action: 'item' });
    }

    // 交換系統：若有相鄰友方單位則顯示交換選項
    const friendlyNeighbors = this.getAdjacentFriendlyUnits(unit);
    if (friendlyNeighbors.length > 0) {
      items.push({ label: '交換', action: 'trade', neighbors: friendlyNeighbors });
    }

    items.push({ label: '待機', action: 'wait' });
    items.push({ label: '取消', action: 'cancel' });

    const menuX = Math.min(screenX, this.canvasW - 120);
    // Use window.innerHeight for mobile fullscreen support, with buffer for mobile UI
    const viewportH = window.innerHeight || this.canvasH;
    const mobileBuffer = 60; // Space for "exit fullscreen" button etc.
    const menuY = Math.min(screenY, viewportH - items.length * 32 - mobileBuffer);
    UI.showActionMenu(items, menuX, menuY, (action, idx) => this.onActionMenuSelect(action, items[idx]));
  }

  onActionMenuSelect(action, menuItem) {
    UI.hideActionMenu();
    switch (action) {
      case 'attack':
        this.state = 'selectTarget';
        this.attackRange = this.attackTargets.map(t => ({ x: t.x, y: t.y }));
        this.healTargets = [];
        break;
      case 'heal':
        if (this.healTargets.length === 1) {
          this.doHeal(this.healTargets[0]);
        } else {
          this.state = 'selectTarget';
          this.attackTargets = [];
          this.attackRange = this.healTargets.map(u => ({ x: u.x, y: u.y }));
        }
        break;
      case 'talk':
        this.doTalk(menuItem.target, menuItem.event);
        break;
      case 'seize':
        this.doSeize();
        break;
      case 'equip': {
        const u = this.selectedUnit;
        const weapons = u.items.filter(it => it.type !== 'consumable' && it.type !== 'staff' && it.usesLeft > 0);
        const pos = this.getMenuPosForUnit(u);
        if (weapons.length === 0) {
          // No weapons — return to action menu
          this.state = 'unitMoved';
          this.showActionMenuForUnit(u, pos.x, pos.y);
          return;
        }
        const equipItems = weapons.map((w, i) => ({
          label: w.name + ' (' + w.usesLeft + '/' + w.uses + ')',
          action: 'equip_post_' + i,
          weaponIndex: i,
        }));
        equipItems.push({ label: '返回', action: 'equip_post_cancel' });
        this.state = 'equipMenu';
        UI.showActionMenu(equipItems, pos.x, pos.y, (action, idx) => {
          UI.hideActionMenu();
          this.state = 'unitMoved';
          if (action === 'equip_post_cancel') {
            this.showActionMenuForUnit(u, pos.x, pos.y);
            return;
          }
          const wi = equipItems[idx].weaponIndex;
          const weapon = weapons[wi];
          const origIdx = u.items.indexOf(weapon);
          if (origIdx > 0) {
            u.items.splice(origIdx, 1);
            u.items.unshift(weapon);
          }
          UI.showUnitPanel(u, GameMap.getTerrain(u.x, u.y));
          this.showActionMenuForUnit(u, pos.x, pos.y);
        });
        break;
      }
      case 'item': {
        const u = this.selectedUnit;
        const pos = this.getMenuPosForUnit(u);
        this.showItemMenu(u, () => {
          this.state = 'unitMoved';
          this.showActionMenuForUnit(u, pos.x, pos.y);
        });
        break;
      }
      case 'trade': {
        // 交換系統
        const u = this.selectedUnit;
        const pos = this.getMenuPosForUnit(u);
        const neighbors = menuItem.neighbors || this.getAdjacentFriendlyUnits(u);
        const reopenAction = () => {
          this.state = 'unitMoved';
          this.showActionMenuForUnit(u, pos.x, pos.y);
        };
        if (neighbors.length === 1) {
          // 只有一個相鄰友方，直接開啟交換畫面
          UI.showTradeMenu(u, neighbors[0], reopenAction);
        } else {
          // 多個相鄰友方，先選擇要交換的對象
          const neighborItems = neighbors.map((n, i) => ({
            label: n.name + ' (' + getClassData(n.classId).name + ')',
            action: 'trade_target_' + i,
            targetUnit: n,
          }));
          neighborItems.push({ label: '取消', action: 'trade_cancel' });
          this.state = 'unitCommand';
          UI.showActionMenu(neighborItems, pos.x, pos.y, (action, idx) => {
            UI.hideActionMenu();
            if (action === 'trade_cancel') { reopenAction(); return; }
            UI.showTradeMenu(u, neighborItems[idx].targetUnit, reopenAction);
          });
        }
        break;
      }
      case 'wait':
        this.doWait();
        break;
      case 'cancel':
        if (this.prevUnitPos) {
          this.selectedUnit.x = this.prevUnitPos.x;
          this.selectedUnit.y = this.prevUnitPos.y;
          this.selectedUnit.moved = false;
        }
        this.cancelSelection();
        break;
    }
  }

  onSelectTargetClick(x, y) {
    if (this.attackTargets.length > 0) {
      const target = this.attackTargets.find(t => t.x === x && t.y === y);
      if (target) {
        const forecast = calculateCombat(this.selectedUnit, target, GameMap);
        if (forecast) {
          UI.showCombatForecast(forecast,
            () => { UI.hideCombatForecast(); this.startCombat(this.selectedUnit, target); },
            () => { UI.hideCombatForecast(); }
          );
        }
        return;
      }
    }
    if (this.healTargets.length > 0) {
      const target = this.healTargets.find(t => t.x === x && t.y === y);
      if (target) { this.doHeal(target); return; }
    }
    // Cancel back to action menu
    this.state = 'unitMoved';
    this.attackRange = [];
    const ts = GameMap.tileSize * GameMap.scale;
    const sx = this.selectedUnit.x * ts - GameMap.camX;
    const sy = this.selectedUnit.y * ts - GameMap.camY;
    this.showActionMenuForUnit(this.selectedUnit, sx, sy);
  }

  startCombat(attacker, defender) {
    this.state = 'combatAnim';
    this.combatAttacker = attacker;
    this.combatDefender = defender;
    this.combatResult = executeCombat(attacker, defender, GameMap);
    const forecast = calculateCombat(attacker, defender, GameMap);
    this.attackRange = [];
    this.healTargets = [];
    BGM.resumeTrack = BGM.currentTrackName;
    if (defender.isBoss || attacker.isBoss) {
      BGM.play('bossBattle', true);
    } else {
      BGM.play('battle', true);
    }
    this.battleScene.start(attacker, defender, this.combatResult, forecast, () => this.finishCombat());
  }

  finishCombat() {
    // Remove dead units from DOM layer before filtering
    for (var i = 0; i < this.units.length; i++) {
      if (this.units[i].hp <= 0) UnitLayer.removeUnit(this.units[i]);
    }
    // Remove dead enemies
    this.units = this.units.filter(u => !(u.hp <= 0 && u.faction === 'enemy'));

    if (AITurn.checkLoseCondition(this)) {
      this.state = 'gameOver';
      BGM.play('gameOver', true);
      UI.showGameOver(() => this.init());
      return;
    }

    if (AITurn.checkWinCondition(this)) {
      AITurn.onChapterClear(this);
      return;
    }

    // EXP — determine which player unit gets exp
    // BUG FIX: 統一主動進攻與反擊殺敵的 EXP 公式
    // executeCombat 現在在防守方殺敵時也會用 calculateExp(defender, attacker, true)
    // 因此 combatResult.exp 對兩種情況都是正確的
    let expUnit = null;
    let expAmt = 0;
    if (this.phase === 'player') {
      // 玩家回合：玩家是進攻方
      if (this.selectedUnit && this.selectedUnit.faction === 'player' && this.selectedUnit.hp > 0 && this.combatResult.exp > 0) {
        expUnit = this.selectedUnit;
        expAmt = this.combatResult.exp;
      }
    } else if (this.phase === 'enemy') {
      // 敵軍回合：玩家是防守方
      const def = this.combatDefender;
      if (def && def.faction === 'player' && def.hp > 0) {
        expUnit = def;
        if (this.combatResult && this.combatResult.exp > 0) {
          // 反擊殺敵：calculateExp(defender=player, attacker=enemy, true) 已正確計算
          expAmt = this.combatResult.exp;
        } else {
          // 非殺敵情況：使用與 calculateExp 相同的公式計算防守 EXP
          const atk = this.combatAttacker;
          const atkEffLevel = atk.level + (atk.promoted ? 20 : 0);
          const defEffLevel = def.level + (def.promoted ? 20 : 0);
          const levelDiff = atkEffLevel - defEffLevel; // 敵方等級 - 我方等級
          expAmt = Math.max(1, Math.floor(1 + levelDiff));
          if (levelDiff < -5) expAmt = 1;
        }
      }
    }

    if (expUnit && expAmt > 0) {
      const gains = expUnit.gainExp(expAmt);
      UI.showExpGain(expUnit, expAmt, () => {
        if (gains) {
          UI.showLevelUp(expUnit, gains, () => this.afterCombatDone());
        } else {
          this.afterCombatDone();
        }
      });
      return;
    }
    this.afterCombatDone();
  }

  afterCombatDone() {
    if (this.selectedUnit) {
      this.selectedUnit.acted = true;
      this.selectedUnit.moved = true;
      this.selectedUnit._selected = false;
      this.selectedUnit._direction = null; // Clear facing direction
    }
    this.selectedUnit = null;
    this.combatResult = null;
    this.attackTargets = [];

    // Resume map music after combat
    if (BGM.resumeTrack) {
      BGM.play(BGM.resumeTrack, true);
      BGM.resumeTrack = null;
    }

    if (this.phase === 'enemy') {
      AITurn.processNextEnemyAction(this);
    } else {
      this.state = 'map';
      UI.hideUnitPanel();
    }
  }

  doHeal(target) {
    const result = executeHeal(this.selectedUnit, target);
    if (result) {
      const ts = GameMap.tileSize * GameMap.scale;
      const sx = target.x * ts - GameMap.camX + ts / 2;
      const sy = target.y * ts - GameMap.camY;
      UI.showDamagePopup(sx, sy, result.healAmt, 'heal');
      if (typeof SFX !== 'undefined') SFX.heal();
      if (result.exp > 0) {
        const gains = this.selectedUnit.gainExp(result.exp);
        if (gains) {
          UI.showLevelUp(this.selectedUnit, gains, () => this.doWait());
          return;
        }
      }
    }
    this.doWait();
  }

  doTalk(target, event) {
    if (target.isCain || target.recruitableBy) {
      target.faction = 'player';
      target.recruited = true;
      target.ai = null;
      target.acted = true;
      // Determine the correct charId for recruitment
      const recruitCharId = target.isCain ? 'cain' : (event.target || target.charId || 'cain');
      target.charId = recruitCharId;
      const charData = CHARACTERS[recruitCharId];
      if (charData) {
        target.portrait = charData.portrait;
        target.growths = charData.growths;
      }
      if (!this.playerRoster.find(u => u.charId === recruitCharId)) {
        this.playerRoster.push(target);
      }
    }
    this.state = 'dialogue';
    this.dialogue.start(event.dialogue, () => this.doWait());
  }

  doSeize() {
    if (this.selectedUnit) this.selectedUnit.acted = true;
    AITurn.onChapterClear(this);
  }

  doWait() {
    if (this.selectedUnit) {
      this.selectedUnit.acted = true;
      this.selectedUnit.moved = true;
      this.selectedUnit._selected = false;
      this.selectedUnit._direction = null; // Clear facing direction
    }
    this.selectedUnit = null;
    this.moveRange = [];
    this.attackRange = [];
    this.attackTargets = [];
    this.healTargets = [];
    this.prevUnitPos = null;
    this.state = 'map';
    UI.hideUnitPanel();
    UI.hideActionMenu();
  }

  cancelSelection() {
    if (this.selectedUnit) {
      this.selectedUnit._selected = false;
      this.selectedUnit._direction = null; // Clear facing direction
    }
    this.selectedUnit = null;
    this.moveRange = [];
    this.attackRange = [];
    this.attackTargets = [];
    this.healTargets = [];
    this.prevUnitPos = null;
    this.state = 'map';
    UI.hideActionMenu();
  }

  endTurn() {
    if (this.state !== 'map' || this.phase !== 'player') return;
    UI.hideActionMenu();
    UI.hideUnitPanel();
    UI.hideEndTurnButton();
    this.cancelSelection();
    AITurn.beginEnemyPhase(this);
  }

  nextChapter() {
    this.currentChapter++;
    GameSave.save(this);
    UI.clearOverlays();
    this.startChapter(this.currentChapter).catch(console.error);
  }



  openMapMenu() {
    this.state = 'mapMenu';
    const reopen = () => this.openMapMenu();
    UI.showMapMenu({
      onUnitList: () => {
        const playerUnits = this.units.filter(u => u.faction === 'player' && u.hp > 0);
        const enemyUnits = this.units.filter(u => u.faction === 'enemy' && u.hp > 0);
        UI.showUnitList(playerUnits, enemyUnits, reopen);
      },
      onSave: () => {
        GameSave.save(this);
        UI.showMapMenuMsg('已存檔！', reopen);
      },
      onMapBrowse: () => {
        MiniMap.show(this, reopen);
      },
      onSettings: () => {
        UI.showSettingsMenu(reopen);
      },
      onEndTurn: () => {
        this.state = 'map';
        this.endTurn();
      },
      onQuit: () => {
        UI.showConfirm('確定要結束遊戲嗎？', () => {
          this.state = 'title';
          UI.clearOverlays();
          this.init();
        }, () => {
          // onCancel: reopen map menu
          this.openMapMenu();
        });
      },
      onClose: () => {
        this.state = 'map';
      },
    });
  }

  enterMapBrowse() {
    this._browseState = this.state;
    this.state = 'mapBrowse';
    UI.showMapBrowseHint();
  }

  exitMapBrowse() {
    this.state = this._browseState || 'map';
    UI.hideMapBrowseHint();
  }

  handleKey(key) {
    // M key: mute toggle (works in all states)
    if (key === 'm' || key === 'M') {
      const muted = BGM.toggleMute();
      const btn = document.getElementById('btn-mute');
      if (btn) btn.textContent = muted ? '🔇' : '🔊';
      return;
    }
    if (this.dialogue.isActive()) {
      if (key === 'Enter' || key === ' ') this.dialogue.advance();
      return;
    }
    if (this.state === 'combatAnim' || this.state === 'enemyPhase' || this.state === 'title' || this.state === 'ending' || this.state === 'mapMenu') return;

    const dirs = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
                   w: [0,-1], s: [0,1], a: [-1,0], d: [1,0] };
    if (dirs[key]) {
      Cursor.move(dirs[key][0], dirs[key][1]);
      GameMap.scrollToward(Cursor.x, Cursor.y, this.canvasW, this.canvasH);
      // Show terrain + unit info at cursor
      const terrain = GameMap.getTerrain(Cursor.x, Cursor.y);
      const unit = this.units.find(u => u.x === Cursor.x && u.y === Cursor.y && u.hp > 0);
      UI.showTerrainInfo(terrain, unit);
      if (unit) UI.showUnitPanel(unit, terrain);
      else if (this.state === 'map') UI.hideUnitPanel();
      return;
    }

    // G key = toggle grid
    if (key === 'g' || key === 'G') {
      GameMap.toggleGrid();
      return;
    }

    // R key = map menu (when idle) or status screen
    if (key === 'r' || key === 'R') {
      if (UI.isStatusScreenOpen()) { UI.hideStatusScreen(); return; }
      if (this.state === 'map' && this.phase === 'player') {
        this.openMapMenu();
        return;
      }
      const unit = this.units.find(u => u.x === Cursor.x && u.y === Cursor.y && u.hp > 0);
      if (unit) { UI.showStatusScreen(unit); }
      return;
    }

    // B key = map browse mode
    if (key === 'b' || key === 'B') {
      if (this.state === 'map' && this.phase === 'player') {
        this.enterMapBrowse();
        return;
      }
      if (this.state === 'mapBrowse') {
        this.exitMapBrowse();
        return;
      }
    }

    if (key === 'Enter' || key === 'z') {
      if (this.state === 'mapBrowse') return; // no unit interaction in browse mode
      // Simulate click at cursor position
      const ts = GameMap.tileSize * GameMap.scale;
      const sx = Cursor.x * ts - GameMap.camX + ts / 2;
      const sy = Cursor.y * ts - GameMap.camY + ts / 2;
      this.handleClick(sx, sy);
      return;
    }

    if (key === 'Escape' || key === 'x') {
      if (UI.isStatusScreenOpen()) { UI.hideStatusScreen(); return; }
      if (this.state === 'mapBrowse') { this.exitMapBrowse(); return; }
      if (this.state === 'unitSelected') {
        this.cancelSelection();
      } else if (this.state === 'unitMoved') {
        if (this.prevUnitPos && this.selectedUnit) {
          this.selectedUnit.x = this.prevUnitPos.x;
          this.selectedUnit.y = this.prevUnitPos.y;
          this.selectedUnit.moved = false;
        }
        UI.hideActionMenu();
        this.cancelSelection();
      } else if (this.state === 'selectTarget') {
        this.attackRange = [];
        this.state = 'unitMoved';
        const ts = GameMap.tileSize * GameMap.scale;
        const sx = this.selectedUnit.x * ts - GameMap.camX;
        const sy = this.selectedUnit.y * ts - GameMap.camY;
        this.showActionMenuForUnit(this.selectedUnit, sx, sy);
      }
    }
  }
}
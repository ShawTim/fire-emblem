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
    Sprites.preloadPortraits();
    const hasSave = !!localStorage.getItem('fe_save');
    UI.showTitleScreen(hasSave);
    this.state = 'title';
    BGM.play('title', true);
  }

  startNewGame() {
    this.playerRoster = [];
    this.currentChapter = 0;
    UI.hideTitleScreen();
    UI.clearOverlays();
    this.startChapter(0);
  }

  continueGame() {
    if (this.loadGame()) {
      UI.hideTitleScreen();
      UI.clearOverlays();
      this.startChapter(this.currentChapter);
    } else {
      this.startNewGame();
    }
  }

  startChapter(id) {
    const chapter = CHAPTERS[id];
    if (!chapter) {
      this.state = 'ending';
      UI.showEnding();
      return;
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
    UI.showEndTurnBtn();
    UI.hideActionMenu();
    UI.hideCombatForecast();
    BGM.play('playerPhase', true);
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

    // Units
    GameMap.renderUnits(ctx, this.units.filter(u => u.hp > 0), this.canvasW, this.canvasH, this);

    // Cursor
    if (['map', 'unitSelected', 'unitCommand', 'selectTarget'].includes(this.state)) {
      Cursor.render(ctx, this.canvasW, this.canvasH);
    }

    // Battle scene
    if (this.battleScene.isActive()) {
      UI.hideUnitPanel();
      this.battleScene.render(ctx, this.canvasW, this.canvasH);
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
        this.state === 'combatAnim' || this.state === 'enemyPhase' || this.state === 'gameOver') return;

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
    const unit = this.units.find(u => u.x === x && u.y === y && u.hp > 0);
    if (unit && unit.faction === 'player' && !unit.acted) {
      this.selectedUnit = unit;
      UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
      this.showUnitCommandMenu(unit);
    } else if (unit) {
      UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
    } else {
      UI.hideUnitPanel();
    }
  }

  getMenuPosForUnit(unit) {
    const ts = GameMap.tileSize * GameMap.scale;
    let mx = unit.x * ts - GameMap.camX + ts + 8;
    let my = unit.y * ts - GameMap.camY;
    // Keep menu on screen
    if (mx > this.canvasW - 130) mx = unit.x * ts - GameMap.camX - 130;
    if (my > this.canvasH - 200) my = this.canvasH - 200;
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
    items.push({ label: '裝備', action: 'cmd_equip' });
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
    if (weapons.length <= 1) {
      // Only one weapon or none — nothing to swap
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

  showItemMenu(unit) {
    if (unit.items.length === 0) {
      this.showUnitCommandMenu(unit);
      return;
    }
    const items = unit.items.map((it, i) => ({
      label: it.name + (it.heals ? ' [回復]' : '') + ' (' + (it.usesLeft || 0) + '/' + (it.uses || 0) + ')',
      action: 'item_' + i,
      itemIndex: i,
    }));
    items.push({ label: '返回', action: 'item_cancel' });

    this.state = 'itemMenu';
    const pos = this.getMenuPosForUnit(unit);
    UI.showActionMenu(items, pos.x, pos.y, (action, idx) => {
      UI.hideActionMenu();
      if (action === 'item_cancel') {
        this.showUnitCommandMenu(unit);
        return;
      }
      const itemIdx = items[idx].itemIndex;
      const item = unit.items[itemIdx];
      // Use consumable (vulnerary etc)
      if (item.heals && unit.hp < unit.maxHp) {
        const healAmt = Math.min(item.heals, unit.maxHp - unit.hp);
        unit.hp += healAmt;
        item.usesLeft--;
        if (item.usesLeft <= 0) unit.items.splice(itemIdx, 1);
        const ts = GameMap.tileSize * GameMap.scale;
        const sx = unit.x * ts - GameMap.camX + ts / 2;
        const sy = unit.y * ts - GameMap.camY;
        UI.showDamagePopup(sx, sy, healAmt, 'heal');
        if (typeof SFX !== 'undefined') SFX.heal();
        UI.showUnitPanel(unit, GameMap.getTerrain(unit.x, unit.y));
      }
      this.showUnitCommandMenu(unit);
    });
  }

  animateMove(unit, path, onDone) {
    if (!path || path.length <= 1) { if (onDone) onDone(); return; }
    if (this.state !== 'enemyPhase') this.state = 'animating';
    let step = 1;
    const advance = () => {
      if (step >= path.length) {
        if (onDone) onDone();
        return;
      }
      unit.x = path[step].x;
      unit.y = path[step].y;
      GameMap.scrollToward(unit.x, unit.y, this.canvasW, this.canvasH);
      step++;
      setTimeout(advance, 90);
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

    items.push({ label: '待機', action: 'wait' });
    items.push({ label: '取消', action: 'cancel' });

    const menuX = Math.min(screenX, this.canvasW - 120);
    const menuY = Math.min(screenY, this.canvasH - items.length * 32 - 10);
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
    // Remove dead enemies
    this.units = this.units.filter(u => !(u.hp <= 0 && u.faction === 'enemy'));

    if (this.checkLoseCondition()) {
      this.state = 'gameOver';
      BGM.play('gameOver', true);
      UI.showGameOver(() => this.init());
      return;
    }

    if (this.checkWinCondition()) {
      this.onChapterClear();
      return;
    }

    // EXP — determine which player unit gets exp
    let expUnit = null;
    let expAmt = 0;
    if (this.selectedUnit && this.selectedUnit.faction === 'player' && this.selectedUnit.hp > 0 && this.combatResult.exp > 0) {
      // Player attacked enemy — attacker gets exp (already calculated)
      expUnit = this.selectedUnit;
      expAmt = this.combatResult.exp;
    } else if (this.phase === 'enemy' && this.combatDefender && this.combatDefender.faction === 'player' && this.combatDefender.hp > 0) {
      // Enemy attacked player — defender gets exp
      const atk = this.combatAttacker;
      const def = this.combatDefender;
      const killed = atk.hp <= 0;
      const atkEffLevel = atk.level + (atk.promoted ? 20 : 0);
      const defEffLevel = def.level + (def.promoted ? 20 : 0);
      const levelDiff = atkEffLevel - defEffLevel;
      if (killed) {
        expAmt = Math.max(1, Math.min(100, Math.floor((atkEffLevel * 10) / defEffLevel) + (levelDiff > 0 ? levelDiff * 3 : 0) + (atk.isBoss ? 40 : 0)));
      } else {
        expAmt = Math.max(1, Math.floor(1 + levelDiff));
        if (levelDiff < -5) expAmt = 1;
      }
      expUnit = def;
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
      this.processNextEnemyAction();
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
    this.onChapterClear();
  }

  doWait() {
    if (this.selectedUnit) {
      this.selectedUnit.acted = true;
      this.selectedUnit.moved = true;
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
    UI.hideEndTurnBtn();
    UI.hideActionMenu();
    UI.hideUnitPanel();
    this.cancelSelection();
    this.beginEnemyPhase();
  }

  beginEnemyPhase() {
    this.phase = 'enemy';
    this.state = 'enemyPhase';
    UI.updateTopBar(this.chapterData.title + '：' + this.chapterData.subtitle, this.turn, 'enemy', this.chapterData.objective);
    UI.showPhaseBanner('enemy');
    BGM.play('enemyPhase', true);

    for (const u of this.units) {
      if (u.faction === 'enemy' && u.hp > 0) u.reset();
    }

    setTimeout(() => {
      this.enemyActions = executeEnemyPhase(this);
      this.enemyActionIndex = 0;
      this.processNextEnemyAction();
    }, 1600);
  }

  processNextEnemyAction() {
    if (this.enemyActionIndex >= this.enemyActions.length) {
      this.turn++;
      if (this.checkWinCondition()) { this.onChapterClear(); return; }
      this.beginPlayerPhase();
      return;
    }

    const action = this.enemyActions[this.enemyActionIndex];
    this.enemyActionIndex++;

    if (action.type === 'wait') {
      setTimeout(() => this.processNextEnemyAction(), 100);
      return;
    }

    const needsMove = action.moveX !== action.unit.x || action.moveY !== action.unit.y;

    const doAfterMove = () => {
      if (action.type === 'attack') {
        GameMap.scrollToward(action.unit.x, action.unit.y, this.canvasW, this.canvasH);
        this.selectedUnit = action.unit;
        // Brief pause after move so player sees positioning before combat
        setTimeout(() => this.startCombat(action.unit, action.target), needsMove ? 300 : 0);
      } else {
        action.unit.acted = true;
        setTimeout(() => this.processNextEnemyAction(), 250);
      }
    };

    // Scroll to enemy unit first so player sees who's about to act
    GameMap.scrollToward(action.unit.x, action.unit.y, this.canvasW, this.canvasH);

    if (needsMove) {
      const path = findPath(action.unit.x, action.unit.y, action.moveX, action.moveY,
        action.unit, GameMap.terrain, this.units, GameMap.width, GameMap.height);
      if (path && path.length > 1) {
        // Small delay before movement starts so you can see who's acting
        setTimeout(() => this.animateMove(action.unit, path, doAfterMove), 300);
      } else if (path) {
        doAfterMove();
      } else {
        // No valid path found — skip this move, stay in place
        action.moveX = action.unit.x;
        action.moveY = action.unit.y;
        doAfterMove();
      }
    } else {
      doAfterMove();
    }
  }

  checkWinCondition() {
    if (!this.chapterData) return false;
    const obj = this.chapterData.objective;
    if (obj === 'rout') return !this.units.some(u => u.faction === 'enemy' && u.hp > 0);
    if (obj === 'boss') return !this.units.some(u => u.faction === 'enemy' && u.hp > 0 && u.isBoss);
    if (obj === 'seize') {
      if (this.chapterData.seizePos) {
        const sp = this.chapterData.seizePos;
        return !!this.units.find(u => u.isLord && u.x === sp.x && u.y === sp.y && u.acted);
      }
      return false;
    }
    if (obj === 'survive') return this.turn > (this.chapterData.surviveTurns || 99);
    return false;
  }

  checkLoseCondition() {
    const lord = this.units.find(u => u.isLord);
    return !lord || lord.hp <= 0;
  }

  onChapterClear() {
    this.state = 'chapterClear';
    UI.hideEndTurnBtn();
    BGM.play('victory', true);
    const postDialogue = this.chapterData.dialogues && this.chapterData.dialogues.post;
    const isLast = this.currentChapter >= CHAPTERS.length - 1;

    const afterDialogue = () => {
      if (isLast) {
        UI.showEnding();
        this.state = 'ending';
      } else {
        this.saveGame();
        UI.showVictory(() => this.nextChapter());
      }
    };

    if (postDialogue) {
      this.state = 'dialogue';
      this.dialogue.start(postDialogue, afterDialogue);
    } else {
      afterDialogue();
    }
  }

  nextChapter() {
    this.currentChapter++;
    this.saveGame();
    UI.clearOverlays();
    this.startChapter(this.currentChapter);
  }

  saveGame() {
    const data = {
      chapter: this.currentChapter + 1,
      roster: this.playerRoster.filter(u => u.hp > 0).map(u => u.serialize()),
    };
    localStorage.setItem('fe_save', JSON.stringify(data));
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('fe_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.currentChapter = data.chapter || 0;
      this.playerRoster = (data.roster || []).map(d => Unit.deserialize(d));
      return true;
    } catch (e) { return false; }
  }

  handleKey(key) {
    // M key: mute toggle (works in all states)
    if (key === 'm' || key === 'M') {
      var muted = BGM.toggleMute();
      var btn = document.getElementById('btn-mute');
      if (btn) btn.textContent = muted ? '🔇' : '🔊';
      return;
    }
    if (this.dialogue.isActive()) {
      if (key === 'Enter' || key === ' ') this.dialogue.advance();
      return;
    }
    if (this.state === 'combatAnim' || this.state === 'enemyPhase' || this.state === 'title' || this.state === 'ending') return;

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

    // R key = status screen
    if (key === 'r' || key === 'R') {
      if (UI.isStatusScreenOpen()) { UI.hideStatusScreen(); return; }
      const unit = this.units.find(u => u.x === Cursor.x && u.y === Cursor.y && u.hp > 0);
      if (unit && unit.faction === 'player') { UI.showStatusScreen(unit); }
      return;
    }

    if (key === 'Enter' || key === 'z') {
      // Simulate click at cursor position
      const ts = GameMap.tileSize * GameMap.scale;
      const sx = Cursor.x * ts - GameMap.camX + ts / 2;
      const sy = Cursor.y * ts - GameMap.camY + ts / 2;
      this.handleClick(sx, sy);
      return;
    }

    if (key === 'Escape' || key === 'x') {
      if (UI.isStatusScreenOpen()) { UI.hideStatusScreen(); return; }
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
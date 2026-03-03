// game/ai-turn.js — Enemy turn logic

var AITurn = {
  /**
   * Begin enemy phase
   * @param {Game} game - Game instance
   */
  beginEnemyPhase: function(game) {
    console.log('beginEnemyPhase called');
    game.phase = 'enemy';
    game.state = 'enemyPhase';
    UI.updateTopBar(game.chapterData.title + '：' + game.chapterData.subtitle, game.turn, 'enemy', game.chapterData.objective);
    UI.showPhaseBanner('enemy');
    BGM.play('enemyPhase', true);
    
    game.applyTerrainHealing('enemy');
    for (const u of game.units) {
      if (u.faction === 'enemy' && u.hp > 0) u.reset();
    }
    
    setTimeout(() => {
      console.log('Starting enemy actions, calling executeEnemyPhase');
      game.enemyActions = executeEnemyPhase(game);
      console.log('Enemy actions:', game.enemyActions);
      game.enemyActionIndex = 0;
      AITurn.processNextEnemyAction(game);
    }, 1600);
  },

  /**
   * Process next enemy action
   * @param {Game} game - Game instance
   */
  processNextEnemyAction: function(game) {
    console.log('processNextEnemyAction called, index:', game.enemyActionIndex, 'total:', game.enemyActions.length);
    if (game.enemyActionIndex >= game.enemyActions.length) {
      game.turn++;
      if (AITurn.checkWinCondition(game)) {
        AITurn.onChapterClear(game);
        return;
      }
      game.beginPlayerPhase();
      return;
    }

    const action = game.enemyActions[game.enemyActionIndex];
    game.enemyActionIndex++;

    if (action.type === 'wait') {
      action.unit.acted = true;
      setTimeout(() => AITurn.processNextEnemyAction(game), 100);
      return;
    }

    const needsMove = action.moveX !== action.unit.x || action.moveY !== action.unit.y;

    const doAfterMove = () => {
      if (action.type === 'attack') {
        const target = action.target;
        if (!target || target.hp <= 0) {
          action.unit.acted = true;
          setTimeout(() => AITurn.processNextEnemyAction(game), 100);
          return;
        }

        const actualDist = Math.abs(action.unit.x - target.x) + Math.abs(action.unit.y - target.y);
        const atkRange = action.unit.getAttackRange();
        if (!atkRange.includes(actualDist)) {
          action.unit.acted = true;
          setTimeout(() => AITurn.processNextEnemyAction(game), 100);
          return;
        }

        GameMap.scrollToward(action.unit.x, action.unit.y, game.canvasW, game.canvasH);
        game.selectedUnit = action.unit;
        setTimeout(() => game.startCombat(action.unit, action.target), needsMove ? 300 : 0);
      } else {
        action.unit.acted = true;
        setTimeout(() => AITurn.processNextEnemyAction(game), 250);
      }
    };

    GameMap.scrollToward(action.unit.x, action.unit.y, game.canvasW, game.canvasH);

    if (needsMove) {
      const path = findPath(action.unit.x, action.unit.y, action.moveX, action.moveY, action.unit, GameMap.terrain, game.units, GameMap.width, GameMap.height);
      if (path && path.length > 1) {
        setTimeout(() => game.animateMove(action.unit, path, doAfterMove), 300);
      } else if (path) {
        doAfterMove();
      } else {
        action.moveX = action.unit.x;
        action.moveY = action.unit.y;
        doAfterMove();
      }
    } else {
      doAfterMove();
    }
  },

  /**
   * Check win condition
   * @param {Game} game - Game instance
   * @returns {boolean}
   */
  checkWinCondition: function(game) {
    if (!game.chapterData) return false;
    const obj = game.chapterData.objective;

    if (obj === 'rout') return !game.units.some(u => u.faction === 'enemy' && u.hp > 0);
    if (obj === 'boss') return !game.units.some(u => u.faction === 'enemy' && u.hp > 0 && u.isBoss);
    if (obj === 'seize') {
      if (game.chapterData.seizePos) {
        const sp = game.chapterData.seizePos;
        return !!game.units.find(u => u.isLord && u.x === sp.x && u.y === sp.y && u.acted);
      }
      return false;
    }
    if (obj === 'survive') return game.turn > (game.chapterData.surviveTurns || 99);
    return false;
  },

  /**
   * Check lose condition
   * @param {Game} game - Game instance
   * @returns {boolean}
   */
  checkLoseCondition: function(game) {
    const lord = game.units.find(u => u.isLord);
    return !lord || lord.hp <= 0;
  },

  /**
   * Handle chapter clear
   * @param {Game} game - Game instance
   */
  onChapterClear: function(game) {
    game.state = 'chapterClear';
    BGM.play('victory', true);

    const postDialogue = game.chapterData.dialogues && game.chapterData.dialogues.post;
    const isLast = game.currentChapter >= CHAPTER_MANIFEST.length - 1;

    const afterDialogue = () => {
      if (isLast) {
        UI.showEnding();
        game.state = 'ending';
      } else {
        GameSave.save(game);
        UI.showVictory(() => game.nextChapter());
      }
    };

    if (postDialogue) {
      game.state = 'dialogue';
      game.dialogue.start(postDialogue, afterDialogue);
    } else {
      afterDialogue();
    }
  }
};

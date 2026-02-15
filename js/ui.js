// ui.js — All UI rendering using DOM overlays

const UI = {
  unitPanel: document.getElementById('unit-panel'),
  unitInfo: document.getElementById('unit-info'),
  actionMenu: document.getElementById('action-menu'),
  forecastEl: document.getElementById('combat-forecast'),
  phaseBanner: document.getElementById('phase-banner'),
  levelUpScreen: document.getElementById('level-up-screen'),
  topBar: document.getElementById('top-bar'),
  endTurnBtn: document.getElementById('btn-end-turn'),
  titleScreen: document.getElementById('title-screen'),
  chapterCard: document.getElementById('chapter-title-card'),
  chapterText: document.getElementById('chapter-title-text'),
  chapterSub: document.getElementById('chapter-title-sub'),

  showUnitPanel(unit) {
    if (!unit) { this.unitPanel.classList.add('hidden'); return; }
    const cls = getClassData(unit.classId);
    const hpPct = Math.round(unit.hp / unit.maxHp * 100);
    const hpColor = hpPct > 50 ? '#4f4' : (hpPct > 25 ? '#cc4' : '#c44');
    this.unitInfo.innerHTML = `
      <div class="stat-name">${unit.name}</div>
      <div class="stat-class">${cls.name} Lv.${unit.level}</div>
      <div class="stat-row"><span class="stat-label">HP</span>
        <span class="stat-hp">${unit.hp}/${unit.maxHp}</span></div>
      <div style="background:#300;height:4px;margin:2px 0">
        <div style="background:${hpColor};height:4px;width:${hpPct}%"></div></div>
      <div class="stat-row"><span class="stat-label">力量</span><span class="stat-val">${unit.str}</span></div>
      <div class="stat-row"><span class="stat-label">魔力</span><span class="stat-val">${unit.mag}</span></div>
      <div class="stat-row"><span class="stat-label">技巧</span><span class="stat-val">${unit.skl}</span></div>
      <div class="stat-row"><span class="stat-label">速度</span><span class="stat-val">${unit.spd}</span></div>
      <div class="stat-row"><span class="stat-label">幸運</span><span class="stat-val">${unit.lck}</span></div>
      <div class="stat-row"><span class="stat-label">防禦</span><span class="stat-val">${unit.def}</span></div>
      <div class="stat-row"><span class="stat-label">魔防</span><span class="stat-val">${unit.res}</span></div>
      <div class="stat-row"><span class="stat-label">移動</span><span class="stat-val">${unit.mov}</span></div>
    `;
    this.unitPanel.classList.remove('hidden');
  },

  hideUnitPanel() { this.unitPanel.classList.add('hidden'); },

  showActionMenu(items, x, y, onClick) {
    this.actionMenu.innerHTML = '';
    items.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'menu-item' + (item.disabled ? ' disabled' : '');
      div.textContent = item.label;
      if (!item.disabled) {
        div.addEventListener('click', (e) => { e.stopPropagation(); onClick(item.action, i); });
      }
      this.actionMenu.appendChild(div);
    });
    // Position
    const ts = GameMap.tileSize * GameMap.scale;
    this.actionMenu.style.left = x + 'px';
    this.actionMenu.style.top = y + 'px';
    this.actionMenu.classList.remove('hidden');
  },

  hideActionMenu() { this.actionMenu.classList.add('hidden'); },

  showCombatForecast(forecast, onConfirm, onCancel) {
    const a = forecast.attacker, d = forecast.defender;
    this.forecastEl.innerHTML = `
      <div class="forecast-header">戰鬥預測</div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.name}</span>
        <span class="forecast-label">VS</span>
        <span class="forecast-defender">${d.name}</span>
      </div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.hp}</span>
        <span class="forecast-label">HP</span>
        <span class="forecast-defender">${d.hp}</span>
      </div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.damage}${a.doubleAttack ? ' ×2' : ''}</span>
        <span class="forecast-label">威力</span>
        <span class="forecast-defender">${d.canCounter ? d.damage + (d.doubleAttack ? ' ×2' : '') : '-'}</span>
      </div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.hit}%</span>
        <span class="forecast-label">命中</span>
        <span class="forecast-defender">${d.canCounter ? d.hit + '%' : '-'}</span>
      </div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.crit}%</span>
        <span class="forecast-label">必殺</span>
        <span class="forecast-defender">${d.canCounter ? d.crit + '%' : '-'}</span>
      </div>
      <div style="text-align:center;margin-top:10px">
        <button id="fc-confirm" style="margin:0 8px;padding:4px 16px;cursor:pointer;background:#4a9eff;border:none;color:#fff;font-family:inherit">確認</button>
        <button id="fc-cancel" style="margin:0 8px;padding:4px 16px;cursor:pointer;background:#666;border:none;color:#fff;font-family:inherit">取消</button>
      </div>
    `;
    this.forecastEl.classList.remove('hidden');
    document.getElementById('fc-confirm').addEventListener('click', (e) => { e.stopPropagation(); onConfirm(); });
    document.getElementById('fc-cancel').addEventListener('click', (e) => { e.stopPropagation(); onCancel(); });
  },

  hideCombatForecast() { this.forecastEl.classList.add('hidden'); },

  showPhaseBanner(phase) {
    const text = phase === 'player' ? '自軍回合' : '敵軍回合';
    const cls = phase === 'player' ? 'banner-player' : 'banner-enemy';
    this.phaseBanner.textContent = text;
    this.phaseBanner.className = cls;
    this.phaseBanner.classList.remove('hidden');
    // Force re-animation
    this.phaseBanner.style.animation = 'none';
    this.phaseBanner.offsetHeight; // reflow
    this.phaseBanner.style.animation = '';
    setTimeout(() => this.phaseBanner.classList.add('hidden'), 1500);
  },

  showLevelUp(unit, gains, onDone) {
    const stats = [
      ['HP', 'hp'], ['力量', 'str'], ['魔力', 'mag'], ['技巧', 'skl'],
      ['速度', 'spd'], ['幸運', 'lck'], ['防禦', 'def'], ['魔防', 'res']
    ];
    let html = `<div class="lvup-title">Level Up! Lv.${unit.level}</div>`;
    for (const [label, key] of stats) {
      const inc = gains[key] ? 1 : 0;
      const cls = inc ? 'increased' : 'same';
      const val = key === 'hp' ? unit.maxHp : unit[key];
      html += `<div class="lvup-stat ${cls}">${label}: ${val} ${inc ? '<span style="color:#ff0">+1</span>' : ''}</div>`;
    }
    this.levelUpScreen.innerHTML = html;
    this.levelUpScreen.classList.remove('hidden');
    setTimeout(() => {
      this.levelUpScreen.classList.add('hidden');
      if (onDone) onDone();
    }, 2000);
  },

  updateTopBar(chapterTitle, turn, phase) {
    document.getElementById('chapter-name').textContent = chapterTitle || '';
    document.getElementById('turn-count').textContent = `第 ${turn} 回合`;
    const pi = document.getElementById('phase-indicator');
    pi.textContent = phase === 'player' ? '自軍回合' : '敵軍回合';
    pi.className = phase === 'player' ? 'phase-player' : 'phase-enemy';
  },

  showEndTurnBtn() { this.endTurnBtn.classList.remove('hidden'); },
  hideEndTurnBtn() { this.endTurnBtn.classList.add('hidden'); },

  showTitleScreen(hasSave) {
    this.titleScreen.classList.remove('hidden');
    const contBtn = document.getElementById('btn-continue');
    if (hasSave) contBtn.classList.remove('hidden');
    else contBtn.classList.add('hidden');
  },
  hideTitleScreen() { this.titleScreen.classList.add('hidden'); },

  showChapterCard(title, subtitle, onDone) {
    this.chapterText.textContent = title;
    this.chapterSub.textContent = subtitle;
    this.chapterCard.classList.remove('hidden');
    // Force re-animation
    this.chapterCard.style.animation = 'none';
    this.chapterCard.offsetHeight;
    this.chapterCard.style.animation = '';
    setTimeout(() => {
      this.chapterCard.classList.add('hidden');
      if (onDone) onDone();
    }, 3000);
  },

  showDamagePopup(screenX, screenY, damage, type) {
    const popup = document.createElement('div');
    popup.className = 'dmg-popup' + (type === 'crit' ? ' dmg-crit' : '') + (type === 'miss' ? ' dmg-miss' : '') + (type === 'heal' ? ' dmg-heal' : '');
    popup.textContent = type === 'miss' ? 'MISS' : (type === 'heal' ? '+' + damage : damage);
    popup.style.left = screenX + 'px';
    popup.style.top = screenY + 'px';
    document.getElementById('ui-overlay').appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  },

  showGameOver(onRestart) {
    const overlay = document.createElement('div');
    overlay.id = 'gameover-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:200;';
    overlay.innerHTML = `
      <div style="font-size:36px;color:#c44;margin-bottom:20px">遊戲結束</div>
      <button id="btn-gameover-restart" style="padding:10px 30px;font-size:16px;cursor:pointer;background:#a33;border:none;color:#fff;font-family:inherit">重新開始</button>
    `;
    document.getElementById('ui-overlay').appendChild(overlay);
    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      overlay.remove();
      if (onRestart) onRestart();
    });
  },

  showVictory(onContinue) {
    const overlay = document.createElement('div');
    overlay.id = 'victory-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:200;';
    overlay.innerHTML = `
      <div style="font-size:28px;color:#ffa500;margin-bottom:10px">章節完成！</div>
      <button id="btn-victory-next" style="padding:10px 30px;font-size:16px;cursor:pointer;background:#4a9eff;border:none;color:#fff;font-family:inherit;margin-top:20px">繼續</button>
    `;
    document.getElementById('ui-overlay').appendChild(overlay);
    document.getElementById('btn-victory-next').addEventListener('click', () => {
      overlay.remove();
      if (onContinue) onContinue();
    });
  },

  showEnding() {
    const overlay = document.createElement('div');
    overlay.id = 'ending-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#000 0%,#0a0a2e 50%,#000 100%);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:200;';
    overlay.innerHTML = `
      <div style="font-size:36px;color:#ffa500;text-shadow:0 0 20px rgba(255,165,0,0.5);margin-bottom:10px">火炎之紋章</div>
      <div style="font-size:20px;color:#ffa500;margin-bottom:40px">翠星之影</div>
      <div style="font-size:24px;color:#fff;margin-bottom:30px">—— 完 ——</div>
      <div style="font-size:14px;color:#888">感謝遊玩</div>
    `;
    document.getElementById('ui-overlay').appendChild(overlay);
  },

  clearOverlays() {
    ['gameover-overlay', 'victory-overlay', 'ending-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }
};

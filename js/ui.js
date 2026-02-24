// ui.js — All UI rendering using DOM overlays

const UI = {
  unitPanel: document.getElementById('unit-panel'),
  unitInfo: document.getElementById('unit-info'),
  actionMenu: document.getElementById('action-menu'),
  forecastEl: document.getElementById('combat-forecast'),
  phaseBanner: document.getElementById('phase-banner'),
  levelUpScreen: document.getElementById('level-up-screen'),
  topBar: document.getElementById('top-bar'),
  terrainInfo: null,
  endTurnBtn: document.getElementById('btn-end-turn'),
  titleScreen: document.getElementById('title-screen'),
  chapterCard: document.getElementById('chapter-title-card'),
  chapterText: document.getElementById('chapter-title-text'),
  chapterSub: document.getElementById('chapter-title-sub'),

  showUnitPanel(unit, terrainType) {
    if (!unit) { this.unitPanel.classList.add('hidden'); return; }
    const cls = getClassData(unit.classId);
    const terrain = terrainType || 'plain';
    const td = { plain:{def:0,avo:0,name:'平原'}, forest:{def:1,avo:20,name:'森林'}, mountain:{def:2,avo:30,name:'山地'}, fort:{def:2,avo:20,name:'砦'}, wall:{def:3,avo:20,name:'城牆'}, gate:{def:3,avo:30,name:'城門'}, river:{def:0,avo:0,name:'河川'}, village:{def:0,avo:10,name:'村莊'}, throne:{def:3,avo:30,name:'王座'}, pillar:{def:1,avo:15,name:'柱子'}, floor:{def:0,avo:0,name:'石板地板'} }[terrain] || {def:0,avo:0,name:terrain};
    const hpPct = Math.round(unit.hp / unit.maxHp * 100);
    const hpColor = hpPct > 50 ? '#4f4' : (hpPct > 25 ? '#cc4' : '#c44');
    const expPct = unit.faction === 'player' ? unit.exp : 0;
    const weapon = unit.getEquippedWeapon ? unit.getEquippedWeapon() : null;
    const atkPow = weapon ? (weapon.magic ? unit.mag + weapon.atk : unit.str + weapon.atk) : 0;
    const hitRate = weapon ? (unit.skl * 2 + unit.lck + weapon.hit) : 0;
    const avoRate = unit.spd * 2 + unit.lck;
    const critRate = weapon ? Math.floor(unit.skl / 2) + weapon.crit : 0;
    // Portrait
    const portraitId = unit.charId || ('_enemy_' + unit.classId);
    const hasPortrait = unit.charId && Sprites._portraitCache[unit.charId] && Sprites._portraitCache[unit.charId].loaded;
    this.unitInfo.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
        <canvas id="panel-portrait" width="32" height="32" style="width:40px;height:40px;border:1px solid ${unit.faction==='player'?'#4a9eff':'#f44'};border-radius:4px;image-rendering:pixelated;flex-shrink:0"></canvas>
        <div>
          <div class="stat-name">${unit.name}</div>
          <div class="stat-class">${cls.name} Lv.${unit.level}</div>
        </div>
      </div>
      <div class="stat-row"><span class="stat-label">HP</span>
        <span class="stat-hp">${unit.hp}/${unit.maxHp}</span></div>
      <div style="background:#300;height:4px;margin:2px 0">
        <div style="background:${hpColor};height:4px;width:${hpPct}%"></div></div>
      ${unit.faction === 'player' ? `
      <div class="stat-row"><span class="stat-label">EXP</span>
        <span class="stat-val" style="color:#8bf">${unit.exp}/100</span></div>
      <div style="background:#224;height:3px;margin:2px 0">
        <div style="background:#48f;height:3px;width:${expPct}%"></div></div>` : ''}
      <div style="border-top:1px solid #333;margin:4px 0;padding-top:2px">
      <div class="stat-row"><span class="stat-label">力量</span><span class="stat-val">${unit.str}</span></div>
      <div class="stat-row"><span class="stat-label">魔力</span><span class="stat-val">${unit.mag}</span></div>
      <div class="stat-row"><span class="stat-label">技巧</span><span class="stat-val">${unit.skl}</span></div>
      <div class="stat-row"><span class="stat-label">速度</span><span class="stat-val">${unit.spd}</span></div>
      <div class="stat-row"><span class="stat-label">幸運</span><span class="stat-val">${unit.lck}</span></div>
      <div class="stat-row"><span class="stat-label">防禦</span><span class="stat-val">${unit.def}</span></div>
      <div class="stat-row"><span class="stat-label">魔防</span><span class="stat-val">${unit.res}</span></div>
      </div>
      <div style="border-top:1px solid #333;margin:4px 0;padding-top:2px">
      <div class="stat-row"><span class="stat-label">攻擊</span><span class="stat-val" style="color:#f88">${atkPow}</span></div>
      <div class="stat-row"><span class="stat-label">命中</span><span class="stat-val" style="color:#8f8">${hitRate}</span></div>
      <div class="stat-row"><span class="stat-label">迴避</span><span class="stat-val" style="color:#8ef">${avoRate}</span></div>
      <div class="stat-row"><span class="stat-label">必殺</span><span class="stat-val" style="color:#ff8">${critRate}</span></div>
      <div class="stat-row"><span class="stat-label">移動</span><span class="stat-val">${unit.mov}</span></div>
      </div>
      ${weapon ? `<div style="border-top:1px solid #333;margin:4px 0;padding-top:2px;font-size:10px;color:#aaa">
      ${weapon.name} <span style="color:#888">(${weapon.usesLeft !== undefined ? weapon.usesLeft : weapon.uses}/${weapon.uses})</span></div>` : ''}
      <div style="border-top:1px solid #333;margin:4px 0;padding-top:2px">
      <div class="stat-row"><span class="stat-label" style="color:#9a8">地形</span><span class="stat-val" style="color:#bc9">${td.name}</span></div>
      ${td.def > 0 ? `<div class="stat-row"><span class="stat-label" style="color:#777">防＋</span><span class="stat-val" style="color:#8cf">${td.def}</span></div>` : ''}
      ${td.avo > 0 ? `<div class="stat-row"><span class="stat-label" style="color:#777">避＋</span><span class="stat-val" style="color:#8cf">${td.avo}</span></div>` : ''}
      </div>
      ${unit.faction === 'player' ? '<div style="font-size:9px;color:#555;margin-top:4px;text-align:center">按 R 或點擊空格 開啟地圖選單</div>' : ''}
    `;
    this.unitPanel.classList.remove('hidden');
    // Draw portrait on panel canvas
    const pCanvas = document.getElementById('panel-portrait');
    if (pCanvas) {
      const pCtx = pCanvas.getContext('2d');
      pCtx.clearRect(0, 0, 32, 32);
      if (unit.charId) {
        Sprites.drawPortrait(pCtx, unit.charId, 32, 32);
      } else {
        Sprites.drawGenericPortrait(pCtx, unit, 32, 32);
      }
    }
  },

  hideUnitPanel() { this.unitPanel.classList.add('hidden'); },

  showTerrainInfo(terrain, unit) {
    if (!this.terrainInfo) {
      this.terrainInfo = document.createElement('div');
      this.terrainInfo.id = 'terrain-info';
      this.terrainInfo.style.cssText = 'position:absolute;bottom:8px;left:8px;background:rgba(10,10,30,0.88);border:1px solid #445;border-radius:4px;padding:4px 8px;font-size:11px;color:#ccd;pointer-events:none;z-index:20;font-family:monospace;min-width:80px';
      document.getElementById('game-container').appendChild(this.terrainInfo);
    }
    const td = {plain:{def:0,avo:0,name:'平原'},forest:{def:1,avo:20,name:'森林'},mountain:{def:2,avo:30,name:'山地'},fort:{def:2,avo:20,name:'砦'},wall:{def:3,avo:20,name:'城牆'},gate:{def:3,avo:30,name:'城門'},river:{def:0,avo:0,name:'河川'},village:{def:0,avo:10,name:'村莊'},throne:{def:3,avo:30,name:'王座'},pillar:{def:1,avo:15,name:'柱子'},floor:{def:0,avo:0,name:'石板地板'}}[terrain] || {def:0,avo:0,name:terrain||'?'};
    let html = '<span style="color:#bc9;font-weight:bold">' + td.name + '</span>';
    if (td.def > 0) html += ' <span style="color:#8cf">防+' + td.def + '</span>';
    if (td.avo > 0) html += ' <span style="color:#8cf">避+' + td.avo + '</span>';
    if (td.def === 0 && td.avo === 0) html += ' <span style="color:#666">無加成</span>';
    this.terrainInfo.innerHTML = html;
    this.terrainInfo.style.display = 'block';
  },

  hideTerrainInfo() {
    if (this.terrainInfo) this.terrainInfo.style.display = 'none';
  },

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
    // Weapon triangle indicator
    var triA = '', triD = '';
    if (forecast.weaponTriangle === 1) { triA = ' <span style="color:#4f4">▲</span>'; triD = ' <span style="color:#f44">▼</span>'; }
    else if (forecast.weaponTriangle === -1) { triA = ' <span style="color:#f44">▼</span>'; triD = ' <span style="color:#4f4">▲</span>'; }
    // Double attack indicator
    var aDbl = a.doubleAttack ? ' <span style="color:#ffd700;font-weight:bold">×2</span>' : '';
    var dDbl = (d.canCounter && d.doubleAttack) ? ' <span style="color:#ffd700;font-weight:bold">×2</span>' : '';
    this.forecastEl.innerHTML = `
      <div class="forecast-header">戰鬥預測</div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.name}${triA}</span>
        <span class="forecast-label">VS</span>
        <span class="forecast-defender">${d.name}${triD}</span>
      </div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.hp}</span>
        <span class="forecast-label">HP</span>
        <span class="forecast-defender">${d.hp}</span>
      </div>
      <div class="forecast-row" style="font-size:10px;color:#aaa">
        <span class="forecast-attacker">${a.weapon || '-'}</span>
        <span class="forecast-label">武器</span>
        <span class="forecast-defender">${d.canCounter && d.weapon ? d.weapon : '-'}</span>
      </div>
      <div class="forecast-row">
        <span class="forecast-attacker">${a.damage}${aDbl}</span>
        <span class="forecast-label">威力</span>
        <span class="forecast-defender">${d.canCounter ? d.damage + '' : '-'}${dDbl}</span>
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
    this.phaseBanner.style.animation = 'none';
    this.phaseBanner.offsetHeight;
    this.phaseBanner.style.animation = '';
    if (typeof SFX !== 'undefined') SFX.phaseChange();
    setTimeout(() => this.phaseBanner.classList.add('hidden'), 1500);
  },

  showLevelUp(unit, gains, onDone) {
    const stats = [
      ['HP', 'hp', unit.maxHp], ['力量', 'str', unit.str], ['魔力', 'mag', unit.mag], ['技巧', 'skl', unit.skl],
      ['速度', 'spd', unit.spd], ['幸運', 'lck', unit.lck], ['防禦', 'def', unit.def], ['魔防', 'res', unit.res]
    ];
    const growths = unit.growths || {};
    let html = `<div class="lvup-title">🎉 Level Up! → Lv.${unit.level}</div>`;
    let totalGains = 0;
    for (const [label, key, val] of stats) {
      const inc = gains[key] || 0;
      totalGains += inc;
      const cls = inc > 0 ? 'increased' : 'same';
      const incText = inc > 1 ? '<span style="color:#ffd700;font-weight:bold">+' + inc + '</span>'
                    : inc === 1 ? '<span style="color:#4f4;font-weight:bold">+1</span>'
                    : '<span style="color:#444">—</span>';
      html += `<div class="lvup-stat ${cls}" style="display:flex;justify-content:space-between;padding:1px 0">
        <span>${label}</span>
        <span style="flex:1;text-align:right;margin-right:8px">${val}</span>
        <span style="width:40px;text-align:center">${incText}</span>
      </div>`;
    }
    // Rating
    let rating = '';
    if (totalGains >= 6) rating = '<div style="color:#ffd700;margin-top:6px;font-size:14px">★ 大豐收！</div>';
    else if (totalGains >= 4) rating = '<div style="color:#4f4;margin-top:6px;font-size:12px">不錯的成長</div>';
    else if (totalGains <= 1) rating = '<div style="color:#c44;margin-top:6px;font-size:12px">……</div>';
    html += rating;
    this.levelUpScreen.innerHTML = html;
    this.levelUpScreen.classList.remove('hidden');
    if (typeof SFX !== 'undefined') SFX.levelUp();
    // Click or tap to dismiss, or auto-dismiss after 4s
    var dismissed = false;
    var dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      this.levelUpScreen.classList.add('hidden');
      this.levelUpScreen.removeEventListener('click', dismiss);
      document.removeEventListener('keydown', dismiss);
      if (onDone) onDone();
    };
    this.levelUpScreen.style.cursor = 'pointer';
    this.levelUpScreen.addEventListener('click', dismiss);
    document.addEventListener('keydown', dismiss);
    setTimeout(dismiss, 4000);
  },

  updateTopBar(chapterTitle, turn, phase, objective) {
    document.getElementById('chapter-name').textContent = chapterTitle || '';
    document.getElementById('turn-count').textContent = `第 ${turn} 回合`;
    const pi = document.getElementById('phase-indicator');
    pi.textContent = phase === 'player' ? '自軍回合' : '敵軍回合';
    pi.className = phase === 'player' ? 'phase-player' : 'phase-enemy';
    // Objective display
    var objEl = document.getElementById('objective-display');
    if (!objEl) {
      objEl = document.createElement('span');
      objEl.id = 'objective-display';
      objEl.style.cssText = 'margin-left:12px;font-size:11px;color:#bc9;';
      document.getElementById('top-bar').appendChild(objEl);
    }
    if (objective) {
      var objNames = {rout:'殲滅敵軍',boss:'擊破敵將',seize:'制壓據點',survive:'堅守防線'};
      objEl.textContent = '目標：' + (objNames[objective] || objective);
    }
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
    if (typeof SFX !== 'undefined') SFX.victory();
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

  // === Full Character Status Screen (R key or click on enemy) ===
  showStatusScreen(unit, onClose) {
    if (!unit) return;
    const isPlayer = unit.faction === 'player';
    const cls = getClassData(unit.classId);
    const growths = unit.growths || {};
    const hpPct = Math.round(unit.hp / unit.maxHp * 100);
    const hpColor = hpPct > 50 ? '#4f4' : (hpPct > 25 ? '#cc4' : '#c44');

    const weapon = unit.getEquippedWeapon ? unit.getEquippedWeapon() : null;
    const atkPow = weapon ? (weapon.magic ? unit.mag + weapon.atk : unit.str + weapon.atk) : 0;
    const hitRate = weapon ? (unit.skl * 2 + unit.lck + weapon.hit) : 0;
    const avoRate = unit.spd * 2 + unit.lck;
    const critRate = weapon ? Math.floor(unit.skl / 2) + weapon.crit : 0;
    const atkSpd = weapon ? Math.max(0, unit.spd - Math.max(0, weapon.weight - unit.str)) : unit.spd;

    // Growth rate stars (visual indicator)
    function growthStars(val) {
      if (!val) return '<span style="color:#555">—</span>';
      if (val >= 60) return '<span style="color:#ffd700">★★★</span>';
      if (val >= 40) return '<span style="color:#8bf">★★</span>';
      if (val >= 20) return '<span style="color:#888">★</span>';
      return '<span style="color:#555">☆</span>';
    }

    function growthColor(val) {
      if (!val) return '#555';
      if (val >= 60) return '#ffd700';
      if (val >= 40) return '#4f4';
      if (val >= 20) return '#8bf';
      return '#888';
    }

    const overlay = document.createElement('div');
    overlay.id = 'status-screen';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,20,0.95);z-index:150;display:flex;justify-content:center;align-items:center;pointer-events:auto;';

    const stats = [
      ['HP', unit.hp + '/' + unit.maxHp, unit.maxHp, growths.hp],
      ['力量', unit.str, unit.str, growths.str],
      ['魔力', unit.mag, unit.mag, growths.mag],
      ['技巧', unit.skl, unit.skl, growths.skl],
      ['速度', unit.spd, unit.spd, growths.spd],
      ['幸運', unit.lck, unit.lck, growths.lck],
      ['防禦', unit.def, unit.def, growths.def],
      ['魔防', unit.res, unit.res, growths.res],
    ];

    let statsHtml = '';
    for (const [label, display, val, growth] of stats) {
      const barW = Math.min(100, (typeof val === 'number' ? val : unit.maxHp) * 3);
      const g = growth || 0;
      statsHtml += `
        <tr>
          <td style="color:#aaa;padding:3px 8px 3px 0;text-align:right;width:50px">${label}</td>
          <td style="color:#fff;font-weight:bold;width:50px;text-align:center">${display}</td>
          <td style="width:120px">
            <div style="background:#223;height:6px;width:100px;display:inline-block;vertical-align:middle">
              <div style="background:${label === 'HP' ? hpColor : '#4a9eff'};height:6px;width:${barW}%"></div>
            </div>
          </td>
          
        </tr>`;
    }

    let itemsHtml = '';
    for (const item of (unit.items || [])) {
      if (!item) continue;
      const uses = item.usesLeft !== undefined ? item.usesLeft : item.uses;
      const equipped = (weapon && item.id === weapon.id) ? ' style="color:#ffd700"' : '';
      itemsHtml += `<div${equipped}>◆ ${item.name} <span style="color:#888">(${uses}/${item.uses})</span></div>`;
    }
    if (!itemsHtml) itemsHtml = '<div style="color:#555">（無裝備）</div>';

    // Promotion paths (player only)
    let promoHtml = '';
    if (isPlayer) {
      if (cls.promo && cls.promo.length > 0) {
        promoHtml = '<div style="margin-top:8px;font-size:11px;color:#aaa">轉職路線：';
        for (const p of cls.promo) {
          const targetCls = getClassData(p.to);
          promoHtml += `<span style="color:#ffa500"> ${targetCls.name}</span>`;
        }
        promoHtml += '</div>';
      } else if (cls.promoted) {
        promoHtml = '<div style="margin-top:8px;font-size:11px;color:#ffa500">（已轉職）</div>';
      }
    }

    const borderColor = isPlayer ? '#4a9eff' : '#ff4a4a';
    const nameColor = isPlayer ? '#4a9eff' : '#ff4a4a';

    overlay.innerHTML = `
      <div style="background:#111;border:2px solid ${borderColor};border-radius:8px;padding:24px;min-width:550px;max-width:650px;font-size:13px">
        <div style="display:flex;gap:24px;margin-bottom:16px;align-items:flex-start">
          <div>
            <canvas id="status-portrait" width="64" height="64" style="image-rendering:pixelated;width:96px;height:96px;border:2px solid ${borderColor}"></canvas>
          </div>
          <div style="flex:1">
            <div style="font-size:20px;color:${nameColor};font-weight:bold">${unit.name}</div>
            <div style="color:#aaa;margin:2px 0">${cls.name}</div>
            <div style="display:flex;gap:20px;margin-top:6px">
              <div>
                <span style="color:#888">Lv.</span>
                <span style="color:#fff;font-size:18px;font-weight:bold">${unit.level}</span>
              </div>
              ${isPlayer ? `<div>
                <span style="color:#888">EXP</span>
                <span style="color:#48f;font-size:14px;font-weight:bold"> ${unit.exp}</span>
                <span style="color:#555">/100</span>
              </div>` : ''}
            </div>
            ${isPlayer ? `<div style="background:#224;height:6px;width:150px;margin-top:4px;border-radius:2px">
              <div style="background:#48f;height:6px;width:${unit.exp * 1.5}px;border-radius:2px"></div>
            </div>` : ''}
            ${promoHtml}
          </div>
        </div>

        <div style="display:flex;gap:24px">
          <div style="flex:1">
            <div style="color:#ffa500;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:4px">
              屬性
            </div>
            <table style="width:100%;font-size:12px">${statsHtml}</table>
          </div>
          <div style="width:1px;background:#333"></div>
          <div style="min-width:160px">
            <div style="color:#ffa500;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:4px">戰鬥數值</div>
            <div class="stat-row" style="margin:4px 0"><span style="color:#aaa;width:60px;display:inline-block">攻擊力</span><span style="color:#f88;font-weight:bold">${atkPow}</span></div>
            <div class="stat-row" style="margin:4px 0"><span style="color:#aaa;width:60px;display:inline-block">命中率</span><span style="color:#8f8;font-weight:bold">${hitRate}</span></div>
            <div class="stat-row" style="margin:4px 0"><span style="color:#aaa;width:60px;display:inline-block">迴避率</span><span style="color:#8ef;font-weight:bold">${avoRate}</span></div>
            <div class="stat-row" style="margin:4px 0"><span style="color:#aaa;width:60px;display:inline-block">必殺率</span><span style="color:#ff8;font-weight:bold">${critRate}%</span></div>
            <div class="stat-row" style="margin:4px 0"><span style="color:#aaa;width:60px;display:inline-block">攻速</span><span style="color:#fff;font-weight:bold">${atkSpd}</span></div>
            <div class="stat-row" style="margin:4px 0"><span style="color:#aaa;width:60px;display:inline-block">移動力</span><span style="color:#fff;font-weight:bold">${unit.mov}</span></div>
            <div style="color:#ffa500;font-weight:bold;margin:12px 0 6px;border-bottom:1px solid #333;padding-bottom:4px">裝備</div>
            <div style="font-size:11px;line-height:1.6">${itemsHtml}</div>
            <div style="color:#ffa500;font-weight:bold;margin:12px 0 6px;border-bottom:1px solid #333;padding-bottom:4px">武器適性</div>
            <div style="font-size:11px;line-height:1.6">${this._getWeaponProficiency(cls)}</div>
          </div>
        </div>
        <div style="text-align:center;margin-top:16px;color:#555;font-size:11px">按 R / Esc / 點擊 關閉</div>
      </div>
    `;

    this._statusOnClose = onClose || null;
    overlay.addEventListener('click', () => { overlay.remove(); const cb = this._statusOnClose; this._statusOnClose = null; if (cb) cb(); });
    document.getElementById('ui-overlay').appendChild(overlay);

    // Draw portrait
    if (typeof Sprites !== 'undefined') {
      const pCanvas = document.getElementById('status-portrait');
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        if (unit.charId && Sprites.drawPortrait) {
          Sprites.drawPortrait(pCtx, unit.charId, 64, 64);
        } else if (Sprites.drawGenericPortrait) {
          Sprites.drawGenericPortrait(pCtx, unit, 64, 64);
        }
      }
    }
  },

  hideStatusScreen() {
    const el = document.getElementById('status-screen');
    if (el) el.remove();
    const cb = this._statusOnClose;
    this._statusOnClose = null;
    if (cb) cb();
  },

  isStatusScreenOpen() {
    return !!document.getElementById('status-screen');
  },

  // === EXP Gain Animation ===
  showExpGain(unit, expGained, onDone) {
    const startExp = Math.max(0, unit.exp >= expGained ? unit.exp - expGained : (unit.exp + 100) - expGained);
    const endExp = startExp + expGained >= 100 ? unit.exp : startExp + expGained;
    const overlay = document.createElement('div');
    overlay.id = 'exp-gain-overlay';
    overlay.style.cssText = 'position:absolute;bottom:130px;left:50%;transform:translateX(-50%);background:rgba(0,0,30,0.95);border:2px solid #48f;border-radius:6px;padding:12px 24px;z-index:45;text-align:center;min-width:200px;pointer-events:auto;';
    
    const cls = getClassData(unit.classId);
    overlay.innerHTML = `
      <div style="color:#4a9eff;font-weight:bold;margin-bottom:6px">${unit.name} <span style="color:#888;font-weight:normal">${cls.name} Lv.${unit.level}</span></div>
      <div style="color:#fff;font-size:16px;margin-bottom:4px">EXP +${expGained}</div>
      <div style="background:#224;height:8px;width:160px;margin:0 auto;border-radius:3px;overflow:hidden">
        <div id="exp-bar-anim" style="background:#48f;height:8px;width:${Math.max(0, startExp) * 1.6}px;border-radius:3px;transition:width 0.8s ease-out"></div>
      </div>
      <div id="exp-text-anim" style="color:#48f;font-size:12px;margin-top:4px">${Math.max(0, startExp)}/100</div>
    `;
    document.getElementById('ui-overlay').appendChild(overlay);

    // Animate bar
    setTimeout(() => {
      const bar = document.getElementById('exp-bar-anim');
      const text = document.getElementById('exp-text-anim');
      if (bar) bar.style.width = (endExp * 1.6) + 'px';
      if (text) text.textContent = endExp + '/100';
    }, 100);

    setTimeout(() => {
      overlay.remove();
      if (onDone) onDone();
    }, 1200);
  },

  _getWeaponProficiency(cls) {
    var weapons = cls.weapons || [];
    var icons = {sword:'⚔️',lance:'🔱',axe:'🪓',bow:'🏹',fire:'🔥',thunder:'⚡',wind:'🌀',dark:'🌑',light:'✨',staff:'✝️'};
    var names = {sword:'劍',lance:'槍',axe:'斧',bow:'弓',fire:'火',thunder:'雷',wind:'風',dark:'暗',light:'光',staff:'杖'};
    if (weapons.length === 0) return '<span style="color:#555">—</span>';
    return weapons.map(function(w) {
      return '<span style="color:#adf">' + (icons[w]||'') + ' ' + (names[w]||w) + '</span>';
    }).join('　');
  },

  clearOverlays() {
    ['gameover-overlay', 'victory-overlay', 'ending-overlay', 'status-screen', 'exp-gain-overlay',
     'map-menu-overlay', 'unit-list-overlay', 'map-browse-hint', 'settings-overlay', 'map-menu-msg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  },

  // ============================================================
  // MAP MENU  (press R during player phase)
  // ============================================================
  showMapMenu(options) {
    this.hideMapMenu(); // remove any existing
    const overlay = document.createElement('div');
    overlay.id = 'map-menu-overlay';
    overlay.style.cssText = [
      'position:absolute;top:0;left:0;right:0;bottom:0',
      'background:rgba(0,0,0,0.6)',
      'display:flex;justify-content:center;align-items:center',
      'z-index:160;pointer-events:auto',
    ].join(';');

    overlay.innerHTML = `
      <div id="map-menu-box" style="
        background:linear-gradient(160deg,#0d0d25,#11162b);
        border:2px solid #4a9eff;border-radius:10px;
        padding:20px 30px;min-width:240px;
        font-family:inherit;font-size:16px;color:#fff;
        box-shadow:0 0 40px rgba(74,158,255,0.3);">
        <div style="text-align:center;font-size:20px;color:#4a9eff;font-weight:bold;margin-bottom:20px;letter-spacing:2px">
          ── 地圖選單 ──
        </div>
        <div id="map-menu-items"></div>
        <div style="text-align:center;margin-top:18px;font-size:11px;color:#555">
          [Esc] 關閉
        </div>
      </div>
    `;

    const menuDefs = [
      { label: '⚔ 部隊情報', desc: '查看我方所有角色的詳細狀態', key: 'onUnitList' },
      { label: '💾 中斷存檔', desc: '儲存目前進度', key: 'onSave' },
      { label: '🗺 地圖查看', desc: '自由移動鏡頭查看地圖', key: 'onMapBrowse' },
      { label: '⚙ 設定',     desc: '音量等各項設定', key: 'onSettings' },
      { label: '🚪 結束遊戲', desc: '返回標題畫面', key: 'onQuit' },
    ];

    const container = overlay.querySelector('#map-menu-items');
    menuDefs.forEach(def => {
      const btn = document.createElement('div');
      btn.style.cssText = [
        'padding:6px 12px;margin:2px 0;border-radius:6px',
        'cursor:pointer;transition:background 0.15s',
        'border:1px solid transparent',
        'user-select:none',
      ].join(';');
      btn.innerHTML = `<span style="font-weight:bold">${def.label}</span>
        <div style="font-size:11px;color:#778;margin-top:2px">${def.desc}</div>`;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(74,158,255,0.18)';
        btn.style.borderColor = '#4a9eff';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = '';
        btn.style.borderColor = 'transparent';
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideMapMenu();
        if (options[def.key]) options[def.key]();
      });
      container.appendChild(btn);
    });

    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideMapMenu();
        if (options.onClose) options.onClose();
      }
    });

    document.getElementById('ui-overlay').appendChild(overlay);

    // Keyboard Escape to close
    this._mapMenuKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideMapMenu();
        document.removeEventListener('keydown', this._mapMenuKeyHandler);
        if (options.onClose) options.onClose();
      }
    };
    document.addEventListener('keydown', this._mapMenuKeyHandler);
  },

  hideMapMenu() {
    const el = document.getElementById('map-menu-overlay');
    if (el) el.remove();
    if (this._mapMenuKeyHandler) {
      document.removeEventListener('keydown', this._mapMenuKeyHandler);
      this._mapMenuKeyHandler = null;
    }
  },

  showMapMenuMsg(msg, onDone) {
    const el = document.createElement('div');
    el.id = 'map-menu-msg';
    el.style.cssText = [
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)',
      'background:rgba(0,10,30,0.95);border:2px solid #4f4',
      'border-radius:8px;padding:20px 40px;z-index:180',
      'font-size:18px;color:#4f4;text-align:center;pointer-events:auto',
    ].join(';');
    el.textContent = msg;
    document.getElementById('ui-overlay').appendChild(el);
    setTimeout(() => {
      el.remove();
      if (onDone) onDone();
    }, 1200);
  },

  // ============================================================
  // UNIT LIST  (部隊情報) — 支援我方/敵方切換分頁
  // ============================================================
  showUnitList(playerUnits, enemyUnits, onClose) {
    const overlay = document.createElement('div');
    overlay.id = 'unit-list-overlay';
    overlay.style.cssText = [
      'position:absolute;top:0;left:0;right:0;bottom:0',
      'background:rgba(0,0,0,0.85)',
      'display:flex;flex-direction:column;justify-content:center;align-items:center',
      'z-index:165;pointer-events:auto;overflow-y:auto',
    ].join(';');

    function buildRows(units, faction) {
      const nameColor = faction === 'player' ? '#4a9eff' : '#ff6060';
      let html = '';
      if (!units || units.length === 0) {
        html = `<tr><td colspan="5" style="padding:16px;text-align:center;color:#555">（無單位）</td></tr>`;
        return html;
      }
      for (const u of units) {
        const cls = getClassData(u.classId);
        const wpn = u.getEquippedWeapon ? u.getEquippedWeapon() : null;
        const hpPct = Math.round(u.hp / u.maxHp * 100);
        const hpColor = hpPct > 50 ? '#4f4' : hpPct > 25 ? '#cc4' : '#c44';
        const items = u.items.map(it => {
          const isWpn = it === wpn;
          return `<span style="color:${isWpn ? '#ffd700' : '#aaa'}">${it.name}<span style="color:#555">(${it.usesLeft})</span></span>`;
        }).join(' ');
        const expCell = faction === 'player'
          ? `<td style="padding:6px 8px;color:#8bf;font-size:11px">${u.exp}/100</td>`
          : `<td style="padding:6px 8px;color:#888;font-size:11px">—</td>`;
        html += `
          <tr style="border-bottom:1px solid #222">
            <td style="padding:6px 8px;color:${nameColor};font-weight:bold;min-width:60px">${u.name}</td>
            <td style="padding:6px 8px;color:#888;font-size:11px;min-width:80px">${cls.name} Lv.${u.level}</td>
            <td style="padding:6px 10px;min-width:80px">
              <span style="color:${hpColor}">${u.hp}/${u.maxHp}</span>
            </td>
            ${expCell}
            <td style="padding:6px 8px;font-size:11px">${items || '<span style="color:#555">—</span>'}</td>
          </tr>`;
      }
      return html;
    }

    const playerRows = buildRows(playerUnits, 'player');
    const enemyRows = buildRows(enemyUnits, 'enemy');

    overlay.innerHTML = `
      <div id="unit-list-box" style="
        background:#0d0d25;border:2px solid #4a9eff;border-radius:10px;
        padding:24px;max-width:720px;width:95%;max-height:85vh;display:flex;flex-direction:column;">
        <div style="text-align:center;font-size:18px;color:#4a9eff;font-weight:bold;margin-bottom:14px">
          ── 部隊情報 ──
        </div>
        <!-- 分頁標籤 -->
        <div style="display:flex;margin-bottom:12px;border-bottom:2px solid #333;">
          <button id="tab-player" style="
            flex:1;padding:8px;font-size:13px;cursor:pointer;border:none;border-radius:4px 4px 0 0;
            background:#4a9eff;color:#fff;font-family:inherit;font-weight:bold;margin-right:2px">
            ⚔ 我方 (${(playerUnits||[]).length})
          </button>
          <button id="tab-enemy" style="
            flex:1;padding:8px;font-size:13px;cursor:pointer;border:none;border-radius:4px 4px 0 0;
            background:#333;color:#aaa;font-family:inherit;font-weight:bold">
            💀 敵方 (${(enemyUnits||[]).length})
          </button>
        </div>
        <!-- 表格區域 -->
        <div style="overflow-y:auto;flex:1;">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:2px solid #333;color:#aaa;font-size:11px">
                <th style="padding:4px 8px;text-align:left">角色</th>
                <th style="padding:4px 8px;text-align:left">職業/等級</th>
                <th style="padding:4px 8px;text-align:left">HP</th>
                <th style="padding:4px 8px;text-align:left">EXP</th>
                <th style="padding:4px 8px;text-align:left">裝備</th>
              </tr>
            </thead>
            <tbody id="unit-list-body">${playerRows}</tbody>
          </table>
        </div>
        <div style="text-align:center;margin-top:14px">
          <button id="unit-list-close" style="
            padding:8px 24px;font-size:14px;cursor:pointer;
            background:#4a9eff;border:none;color:#fff;
            border-radius:4px;font-family:inherit">
            返回地圖選單
          </button>
        </div>
      </div>
    `;

    let currentTab = 'player';
    const tabPlayer = overlay.querySelector('#tab-player');
    const tabEnemy = overlay.querySelector('#tab-enemy');
    const body = overlay.querySelector('#unit-list-body');

    tabPlayer.addEventListener('click', () => {
      currentTab = 'player';
      body.innerHTML = playerRows;
      tabPlayer.style.background = '#4a9eff'; tabPlayer.style.color = '#fff';
      tabEnemy.style.background = '#333'; tabEnemy.style.color = '#aaa';
    });
    tabEnemy.addEventListener('click', () => {
      currentTab = 'enemy';
      body.innerHTML = enemyRows;
      tabEnemy.style.background = '#ff6060'; tabEnemy.style.color = '#fff';
      tabPlayer.style.background = '#333'; tabPlayer.style.color = '#aaa';
    });

    overlay.querySelector('#unit-list-close').addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.remove();
      if (onClose) onClose();
    });

    document.getElementById('ui-overlay').appendChild(overlay);
  },

  // ============================================================
  // TRADE MENU  (交換道具)
  // ============================================================
  showTradeMenu(unitA, unitB, onDone) {
    const MAX_ITEMS = 5;
    const overlay = document.createElement('div');
    overlay.id = 'trade-overlay';
    overlay.style.cssText = [
      'position:absolute;top:0;left:0;right:0;bottom:0',
      'background:rgba(0,0,0,0.88)',
      'display:flex;justify-content:center;align-items:center',
      'z-index:170;pointer-events:auto',
    ].join(';');

    function renderTrade() {
      const clsA = getClassData(unitA.classId);
      const clsB = getClassData(unitB.classId);

      function itemList(unit, side) {
        let html = '';
        const items = unit.items;
        const other = side === 'A' ? unitB : unitA;
        for (let i = 0; i < MAX_ITEMS; i++) {
          const it = items[i];
          if (it) {
            const canGive = other.items.length < MAX_ITEMS;
            const giveBtn = side === 'A'
              ? `<button data-side="A" data-idx="${i}" data-action="give" style="
                  padding:2px 8px;cursor:${canGive?'pointer':'not-allowed'};font-size:11px;
                  background:${canGive?'#4a9eff':'#333'};border:none;color:#fff;border-radius:3px;font-family:inherit">
                  →
                </button>`
              : `<button data-side="B" data-idx="${i}" data-action="give" style="
                  padding:2px 8px;cursor:${canGive?'pointer':'not-allowed'};font-size:11px;
                  background:${canGive?'#ff6060':'#333'};border:none;color:#fff;border-radius:3px;font-family:inherit">
                  ←
                </button>`;
            const uses = it.usesLeft !== undefined ? it.usesLeft : it.uses;
            html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #222">
              ${side === 'A' ? giveBtn : ''}
              <span style="flex:1;font-size:12px;color:#ddd">${it.name} <span style="color:#666">(${uses}/${it.uses})</span></span>
              ${side === 'B' ? giveBtn : ''}
            </div>`;
          } else {
            html += `<div style="padding:4px 0;border-bottom:1px solid #181818;color:#444;font-size:11px;height:24px">—</div>`;
          }
        }
        return html;
      }

      overlay.innerHTML = `
        <div style="background:#0d0d25;border:2px solid #4a9eff;border-radius:10px;padding:20px;min-width:480px;max-width:600px">
          <div style="text-align:center;font-size:18px;color:#ffa500;font-weight:bold;margin-bottom:14px">
            ── 交換道具 ──
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <!-- 單位 A -->
            <div style="flex:1">
              <div style="text-align:center;color:#4a9eff;font-weight:bold;margin-bottom:8px;font-size:13px">
                ${unitA.name} <span style="color:#888;font-weight:normal">${clsA.name}</span>
                <div style="color:#888;font-size:11px">${unitA.items.length}/${MAX_ITEMS} 道具</div>
              </div>
              <div id="trade-list-A">${itemList(unitA, 'A')}</div>
            </div>
            <!-- 中間箭頭 -->
            <div style="width:24px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding-top:40px;color:#555;font-size:20px">⇌</div>
            <!-- 單位 B -->
            <div style="flex:1">
              <div style="text-align:center;color:#ff6060;font-weight:bold;margin-bottom:8px;font-size:13px">
                ${unitB.name} <span style="color:#888;font-weight:normal">${clsB.name}</span>
                <div style="color:#888;font-size:11px">${unitB.items.length}/${MAX_ITEMS} 道具</div>
              </div>
              <div id="trade-list-B">${itemList(unitB, 'B')}</div>
            </div>
          </div>
          <div style="text-align:center;margin-top:16px;font-size:11px;color:#666">點擊 → 將道具給予右方單位；點擊 ← 給予左方單位</div>
          <div style="text-align:center;margin-top:10px">
            <button id="trade-done" style="padding:8px 28px;font-size:14px;cursor:pointer;background:#4a9eff;border:none;color:#fff;border-radius:4px;font-family:inherit">
              完成
            </button>
          </div>
        </div>
      `;

      // Attach give-button handlers
      overlay.querySelectorAll('[data-action="give"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const side = btn.dataset.side;
          const idx = parseInt(btn.dataset.idx);
          const giver = side === 'A' ? unitA : unitB;
          const receiver = side === 'A' ? unitB : unitA;
          if (receiver.items.length >= MAX_ITEMS) return; // Full
          const [item] = giver.items.splice(idx, 1);
          receiver.items.push(item);
          // Re-render
          renderTrade();
        });
      });

      overlay.querySelector('#trade-done').addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.remove();
        if (onDone) onDone();
      });
    }

    document.getElementById('ui-overlay').appendChild(overlay);
    renderTrade();
  },

  // ============================================================
  // SETTINGS MENU  (設定)
  // ============================================================
  showSettingsMenu(onClose) {
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = [
      'position:absolute;top:0;left:0;right:0;bottom:0',
      'background:rgba(0,0,0,0.75)',
      'display:flex;justify-content:center;align-items:center',
      'z-index:165;pointer-events:auto',
    ].join(';');

    const isMuted = typeof BGM !== 'undefined' && BGM.muted;
    overlay.innerHTML = `
      <div style="
        background:#0d0d25;border:2px solid #4a9eff;border-radius:10px;
        padding:28px 40px;min-width:300px;font-size:14px;color:#fff;">
        <div style="text-align:center;font-size:18px;color:#4a9eff;font-weight:bold;margin-bottom:20px">
          ── 設定 ──
        </div>
        <div style="margin:12px 0;display:flex;align-items:center;justify-content:space-between">
          <span>背景音樂</span>
          <button id="setting-mute" style="
            padding:6px 18px;cursor:pointer;border:none;border-radius:4px;
            background:${isMuted ? '#555' : '#4a9eff'};color:#fff;font-family:inherit">
            ${isMuted ? '🔇 靜音' : '🔊 開啟'}
          </button>
        </div>
        <div style="margin:12px 0;display:flex;align-items:center;justify-content:space-between">
          <span>網格顯示</span>
          <button id="setting-grid" style="
            padding:6px 18px;cursor:pointer;border:none;border-radius:4px;
            background:#4a9eff;color:#fff;font-family:inherit">
            切換 [G]
          </button>
        </div>
        <div style="margin:20px 0 0;text-align:center">
          <button id="settings-close" style="
            padding:8px 24px;font-size:14px;cursor:pointer;
            background:#4a9eff;border:none;color:#fff;
            border-radius:4px;font-family:inherit">
            返回地圖選單
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('#setting-mute').addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof BGM !== 'undefined') {
        const muted = BGM.toggleMute();
        e.target.style.background = muted ? '#555' : '#4a9eff';
        e.target.textContent = muted ? '🔇 靜音' : '🔊 開啟';
        const btn = document.getElementById('btn-mute');
        if (btn) btn.textContent = muted ? '🔇' : '🔊';
      }
    });

    overlay.querySelector('#setting-grid').addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof GameMap !== 'undefined') GameMap.toggleGrid();
    });

    overlay.querySelector('#settings-close').addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.remove();
      if (onClose) onClose();
    });

    document.getElementById('ui-overlay').appendChild(overlay);
  },

  // ============================================================
  // MAP BROWSE HINT  (地圖查看模式)
  // ============================================================
  showMapBrowseHint() {
    let hint = document.getElementById('map-browse-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'map-browse-hint';
      hint.style.cssText = [
        'position:absolute;bottom:12px;left:50%;transform:translateX(-50%)',
        'background:rgba(0,0,30,0.85);border:1px solid #4a9eff',
        'border-radius:6px;padding:8px 20px;z-index:50',
        'font-size:13px;color:#8bf;pointer-events:none',
        'white-space:nowrap',
      ].join(';');
    }
    hint.textContent = '📷 地圖查看模式：方向鍵移動鏡頭  |  [B] / [Esc] 離開';
    document.getElementById('game-container').appendChild(hint);
  },

  hideMapBrowseHint() {
    const hint = document.getElementById('map-browse-hint');
    if (hint) hint.remove();
  },
};

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
    const expPct = unit.faction === 'player' ? unit.exp : 0;
    const weapon = unit.getEquippedWeapon ? unit.getEquippedWeapon() : null;
    const atkPow = weapon ? (weapon.magic ? unit.mag + weapon.might : unit.str + weapon.might) : 0;
    const hitRate = weapon ? (unit.skl * 2 + unit.lck + weapon.hit) : 0;
    const avoRate = unit.spd * 2 + unit.lck;
    const critRate = weapon ? Math.floor(unit.skl / 2) + weapon.crit : 0;
    this.unitInfo.innerHTML = `
      <div class="stat-name">${unit.name}</div>
      <div class="stat-class">${cls.name} Lv.${unit.level}</div>
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
      ${unit.faction === 'player' ? '<div style="font-size:9px;color:#555;margin-top:4px;text-align:center">按 R 查看詳細</div>' : ''}
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
    setTimeout(() => {
      this.levelUpScreen.classList.add('hidden');
      if (onDone) onDone();
    }, 2500);
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

  // === Full Character Status Screen (R key) ===
  showStatusScreen(unit) {
    if (!unit || unit.faction !== 'player') return;
    const cls = getClassData(unit.classId);
    const growths = unit.growths || {};
    const hpPct = Math.round(unit.hp / unit.maxHp * 100);
    const hpColor = hpPct > 50 ? '#4f4' : (hpPct > 25 ? '#cc4' : '#c44');

    const weapon = unit.getEquippedWeapon ? unit.getEquippedWeapon() : null;
    const atkPow = weapon ? (weapon.magic ? unit.mag + weapon.might : unit.str + weapon.might) : 0;
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

    // Promotion paths
    let promoHtml = '';
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

    overlay.innerHTML = `
      <div style="background:#111;border:2px solid #4a9eff;border-radius:8px;padding:24px;min-width:550px;max-width:650px;font-size:13px">
        <div style="display:flex;gap:24px;margin-bottom:16px;align-items:flex-start">
          <div>
            <canvas id="status-portrait" width="64" height="64" style="image-rendering:pixelated;width:96px;height:96px;border:2px solid #4a9eff"></canvas>
          </div>
          <div style="flex:1">
            <div style="font-size:20px;color:#4a9eff;font-weight:bold">${unit.name}</div>
            <div style="color:#aaa;margin:2px 0">${cls.name}</div>
            <div style="display:flex;gap:20px;margin-top:6px">
              <div>
                <span style="color:#888">Lv.</span>
                <span style="color:#fff;font-size:18px;font-weight:bold">${unit.level}</span>
              </div>
              <div>
                <span style="color:#888">EXP</span>
                <span style="color:#48f;font-size:14px;font-weight:bold"> ${unit.exp}</span>
                <span style="color:#555">/100</span>
              </div>
            </div>
            <div style="background:#224;height:6px;width:150px;margin-top:4px;border-radius:2px">
              <div style="background:#48f;height:6px;width:${unit.exp * 1.5}px;border-radius:2px"></div>
            </div>
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
          </div>
        </div>
        <div style="text-align:center;margin-top:16px;color:#555;font-size:11px">按 R / Esc / 點擊 關閉</div>
      </div>
    `;

    overlay.addEventListener('click', () => overlay.remove());
    document.getElementById('ui-overlay').appendChild(overlay);

    // Draw portrait
    if (unit.charId && typeof Sprites !== 'undefined' && Sprites.drawPortrait) {
      const pCanvas = document.getElementById('status-portrait');
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        Sprites.drawPortrait(pCtx, unit.charId, 64, 64);
      }
    }
  },

  hideStatusScreen() {
    const el = document.getElementById('status-screen');
    if (el) el.remove();
  },

  isStatusScreenOpen() {
    return !!document.getElementById('status-screen');
  },

  // === EXP Gain Animation ===
  showExpGain(unit, expGained, onDone) {
    const startExp = unit.exp - expGained;
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
      if (bar) bar.style.width = (unit.exp * 1.6) + 'px';
      if (text) text.textContent = unit.exp + '/100';
    }, 100);

    setTimeout(() => {
      overlay.remove();
      if (onDone) onDone();
    }, 1200);
  },

  clearOverlays() {
    ['gameover-overlay', 'victory-overlay', 'ending-overlay', 'status-screen', 'exp-gain-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }
};

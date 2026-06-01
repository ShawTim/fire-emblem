// battle.js — GBA-style battle animation system

class BattleScene {
  constructor() {
    this.active = false;
    this.phase = 'idle';
    this.timer = 0;
    this.phaseDuration = 0;
    this.attacker = null;
    this.defender = null;
    this.combatSteps = [];
    this.stepIndex = 0;
    this.attackerHP = 0;
    this.defenderHP = 0;
    this.attackerMaxHP = 0;
    this.defenderMaxHP = 0;
    this.attackerTargetHP = 0;
    this.defenderTargetHP = 0;
    this.effects = [];
    this.onComplete = null;
    this.fadeAlpha = 1;
    this.attackerSlide = 0;
    this.defenderSlide = 0;
    this.panelAlpha = 0;
    this.attackerAnimOffset = 0;
    this.defenderAnimOffset = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
    this.attackerDead = false;
    this.defenderDead = false;
    this.deathAlpha = 1;
    this.deathFall = 0;
    this.terrainType = 'plain';
    this.defenderTerrainType = 'plain';
    this.forecast = null;
    this.hitTriggered = false;
    this.vsAlpha = 0;
    this.hitDisplayShown = false;
    this.attackerFlash = 0;
    this.defenderFlash = 0;
    this.critZoomTimer = 0;
    this.critZoom = 0;
  }

  start(attacker, defender, combatResult, forecast, onComplete) {
    this.active = true;
    this.attacker = attacker;
    this.defender = defender;
    this.combatSteps = combatResult.steps || [];
    this.stepIndex = 0;
    this.forecast = forecast;
    this.onComplete = onComplete;
    let atkHP = attacker.hp, defHP = defender.hp;
    for (let i = this.combatSteps.length - 1; i >= 0; i--) {
      const st = this.combatSteps[i];
      if (st.hit) {
        if (st.target === attacker) atkHP += st.damage;
        else if (st.target === defender) defHP += st.damage;
      }
    }
    this.attackerHP = Math.min(atkHP, attacker.maxHp);
    this.defenderHP = Math.min(defHP, defender.maxHp);
    this.attackerMaxHP = attacker.maxHp;
    this.defenderMaxHP = defender.maxHp;
    this.attackerTargetHP = this.attackerHP;
    this.defenderTargetHP = this.defenderHP;
    this.attackerDead = false; this.defenderDead = false;
    this.deathAlpha = 1; this.deathFall = 0;
    this.effects = []; this.fadeAlpha = 1;
    this.attackerSlide = -200; this.defenderSlide = 200;
    this.panelAlpha = 0;
    this.attackerAnimOffset = 0; this.defenderAnimOffset = 0;
    this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0;
    this.hitTriggered = false;
    this.vsAlpha = 0;
    this.hitDisplayShown = false;
    this.attackerFlash = 0; this.defenderFlash = 0;
    this.critZoomTimer = 0; this.critZoom = 0;
    const dt = GameMap.getEffectiveTerrain(defender.x, defender.y);
    this.terrainType = dt || 'plain';
    const at = GameMap.getEffectiveTerrain(attacker.x, attacker.y);
    this.defenderTerrainType = dt || 'plain';
    this.attackerTerrainType = at || 'plain';
    this.setPhase('intro');
  }

  setPhase(p) {
    this.phase = p; this.timer = 0; this.hitTriggered = false; this.hitDisplayShown = false;
    const d = {intro:400,vs:1200,ready:600,atk1:1100,def1:1100,atk2:1100,def2:1100,result:1500,outro:500};
    this.phaseDuration = d[p] || 0;
  }

  nextPhase() {
    switch(this.phase) {
      case 'intro': this.setPhase('vs'); break;
      case 'vs': this.setPhase('ready'); break;
      case 'ready':
        this.stepIndex < this.combatSteps.length ? this.beginStrike() : this.setPhase('result'); break;
      case 'atk1': case 'def1': case 'atk2': case 'def2':
        this.stepIndex < this.combatSteps.length ? this.beginStrike() : this.setPhase('result'); break;
      case 'result': this.setPhase('outro'); break;
      case 'outro': this.active = false; this.phase = 'idle'; if(this.onComplete) this.onComplete(); break;
    }
  }

  beginStrike() {
    const s = this.combatSteps[this.stepIndex];
    const a = s.actor === this.attacker;
    this.setPhase(a ? (this.stepIndex<=1?'atk1':'atk2') : (this.stepIndex<=1?'def1':'def2'));
    this.attackerAnimOffset = 0; this.defenderAnimOffset = 0;
    if (s.hit) {
      if (s.target === this.defender) this.defenderTargetHP = Math.max(0, this.defenderTargetHP - s.damage);
      else this.attackerTargetHP = Math.max(0, this.attackerTargetHP - s.damage);
    }
    this.stepIndex++;
  }

  update(dt) {
    if (!this.active) return;
    this.timer += dt;
    const t = Math.min(1, this.timer / this.phaseDuration);
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const intensity = Math.min(1, this.shakeTimer / 200);
      this.shakeX = (Math.random()-0.5)*12*intensity; this.shakeY = (Math.random()-0.5)*10*intensity;
      if (this.shakeTimer <= 0) { this.shakeX=0; this.shakeY=0; }
    }
    if (this.attackerFlash > 0) this.attackerFlash = Math.max(0, this.attackerFlash - dt);
    if (this.defenderFlash > 0) this.defenderFlash = Math.max(0, this.defenderFlash - dt);
    if (this.critZoomTimer > 0) {
      this.critZoomTimer -= dt;
      const zt = 1 - Math.max(0, this.critZoomTimer) / 280;
      this.critZoom = Math.sin(zt * Math.PI) * 0.15;
      if (this.critZoomTimer <= 0) { this.critZoom = 0; this.critZoomTimer = 0; }
    }
    const hs = dt * 0.03;
    if (this.attackerHP > this.attackerTargetHP) {
      const diff = this.attackerHP - this.attackerTargetHP;
      const speed = Math.max(0.3, diff * 0.06) * dt * 0.035;
      this.attackerHP = Math.max(this.attackerTargetHP, this.attackerHP - speed);
    }
    if (this.defenderHP > this.defenderTargetHP) {
      const diff = this.defenderHP - this.defenderTargetHP;
      const speed = Math.max(0.3, diff * 0.06) * dt * 0.035;
      this.defenderHP = Math.max(this.defenderTargetHP, this.defenderHP - speed);
    }
    for (let i = this.effects.length-1; i >= 0; i--) {
      this.effects[i].timer += dt;
      if (this.effects[i].timer >= this.effects[i].duration) this.effects.splice(i,1);
    }
    switch(this.phase) {
      case 'intro': this.fadeAlpha = 1-t; if(this.timer>=this.phaseDuration) this.nextPhase(); break;
      case 'vs':
        this.vsAlpha = t < 0.2 ? this._eo(t/0.2) : (t > 0.75 ? 1-this._eo((t-0.75)/0.25) : 1);
        this.attackerSlide = -200; this.defenderSlide = 200;
        if(this.timer>=this.phaseDuration) this.nextPhase(); break;
      case 'ready':
        this.attackerSlide = -200*(1-this._eo(t)); this.defenderSlide = 200*(1-this._eo(t));
        this.panelAlpha = this._eo(t); if(this.timer>=this.phaseDuration) this.nextPhase(); break;
      case 'atk1': case 'atk2': case 'def1': case 'def2':
        this._upStrike(t); if(this.timer>=this.phaseDuration) this.nextPhase(); break;
      case 'result':
        if(this.defenderTargetHP<=0 && !this.defenderDead) {
          this.defenderDead=true; this.effects.push({type:'defeat',x:0,y:0,text:'撃破！',color:'#ff4444',duration:1200,timer:0});
        }
        if(this.attackerTargetHP<=0 && !this.attackerDead) {
          this.attackerDead=true; this.effects.push({type:'defeat',x:0,y:0,text:'撃破！',color:'#ff4444',duration:1200,timer:0});
        }
        if(this.defenderDead||this.attackerDead) { this.deathAlpha=Math.max(0,1-t*1.5); this.deathFall=t*30; }
        if(this.timer>=this.phaseDuration) this.nextPhase(); break;
      case 'outro': this.fadeAlpha=t; if(this.timer>=this.phaseDuration) this.nextPhase(); break;
    }
  }

  _upStrike(t) {
    const s = this.combatSteps[this.stepIndex-1]; if(!s) return;
    const a = s.actor === this.attacker;
    // Show hit% display at start of strike
    if(t<0.15 && !this.hitDisplayShown && this.forecast){
      this.hitDisplayShown = true;
      const fc = a ? this.forecast.attacker : (this.forecast.defender.canCounter ? this.forecast.defender : null);
      if(fc){
        const hitPct = fc.hit || 0;
        const critPct = fc.crit || 0;
        const tx = a ? 240 : 560;
        this.effects.push({type:'hitpct',x:tx,y:180,text:'命中'+hitPct+'%',color:'#8f8',duration:500,timer:0});
        if(critPct > 0) this.effects.push({type:'hitpct',x:tx,y:200,text:'必殺'+critPct+'%',color:'#ff8',duration:500,timer:0});
      }
    }
    if (t<0.3) { var d=t/0.3; if(a) this.attackerAnimOffset=this._eo(d)*50; else this.defenderAnimOffset=-this._eo(d)*50; }
    else if (t<0.5) {
      if(a) this.attackerAnimOffset=50; else this.defenderAnimOffset=-50;
      if(!this.hitTriggered){this.hitTriggered=true;this._hit(s,a);}
    } else if (t<0.75) {
      var r=(t-0.5)/0.25;
      if(a) this.attackerAnimOffset=50*(1-this._ei(r)); else this.defenderAnimOffset=-50*(1-this._ei(r));
      if(s.hit){var k=(t-0.5)/0.25; if(a) this.defenderAnimOffset=15*Math.sin(k*Math.PI); else this.attackerAnimOffset=-15*Math.sin(k*Math.PI);}
    } else { this.attackerAnimOffset=0; this.defenderAnimOffset=0; }
  }

  _hit(s, a) {
    var tx=a?560:240, ty=240;
    if(!s.hit){this.effects.push({type:'miss',x:tx,y:ty,text:'MISS',color:'#999',duration:800,timer:0});if(typeof SFX!=='undefined')SFX.miss();return;}
    if(s.crit){
      this.effects.push({type:'flash',x:0,y:0,text:'',color:'#ffff00',duration:250,timer:0});
      this.effects.push({type:'flash',x:0,y:0,text:'',color:'#ffffff',duration:100,timer:0});
      this.effects.push({type:'crit',x:400,y:160,text:'必殺！',color:'#ffd700',duration:1000,timer:0});
      this.effects.push({type:'damage',x:tx,y:ty-30,text:String(s.damage),color:'#ffd700',duration:1000,timer:0});
      this.shakeTimer=500;
      this.critZoomTimer=280;
      if(typeof SFX!=='undefined')SFX.crit();
    } else {
      this.effects.push({type:'flash',x:0,y:0,text:'',color:'#ffffff',duration:150,timer:0});
      this.effects.push({type:'damage',x:tx,y:ty-20,text:String(s.damage),color:'#ff3333',duration:800,timer:0});
      this.shakeTimer=150;
      if(typeof SFX!=='undefined')SFX.hit();
    }
    if(s.target===this.defender) this.defenderFlash=260; else this.attackerFlash=260;
  }

  _eo(t){return 1-Math.pow(1-t,3);} _ei(t){return t*t*t;} isActive(){return this.active;}

  render(ctx, cw, ch) {
    if(!this.active) return;
    ctx.save();
    if (this.critZoom !== 0) {
      ctx.translate(cw/2, ch/2);
      ctx.scale(1+this.critZoom, 1+this.critZoom);
      ctx.translate(-cw/2, -ch/2);
    }
    ctx.translate(this.shakeX, this.shakeY);
    this._drawBg(ctx, this.terrainType, cw, ch);
    this._drawPlat(ctx, cw, ch);
    // Terrain labels
    this._drawTerrainLabel(ctx, this.attackerTerrainType, 20, ch*0.58);
    this._drawTerrainLabel(ctx, this.terrainType, cw-120, ch*0.58);
    var gy=ch*0.62, ax=180+this.attackerSlide+this.attackerAnimOffset;
    var dx=cw-180+this.defenderSlide+this.defenderAnimOffset, sz=64;
    var atkS=(this.phase==='atk1'||this.phase==='atk2');
    var defS=(this.phase==='def1'||this.phase==='def2');
    if(!this.attackerDead||this.deathAlpha>0){
      ctx.save(); if(this.attackerDead){ctx.globalAlpha=this.deathAlpha;ctx.translate(0,this.deathFall);}
      this._drawUnit(ctx,this.attacker,ax-sz/2,gy-sz,sz,'right',atkS,this.attackerFlash); ctx.restore();
    }
    if(!this.defenderDead||this.deathAlpha>0){
      ctx.save(); if(this.defenderDead){ctx.globalAlpha=this.deathAlpha;ctx.translate(0,this.deathFall);}
      this._drawUnit(ctx,this.defender,dx-sz/2,gy-sz,sz,'left',defS,this.defenderFlash); ctx.restore();
    }
    if(this.panelAlpha>0){
      ctx.globalAlpha=this.panelAlpha;
      this._drawHP(ctx,this.attacker,this.attackerHP,20,ch-150,false,cw);
      this._drawHP(ctx,this.defender,this.defenderHP,cw-290,ch-150,true,cw);
      ctx.globalAlpha=1;
    }
    // VS display
    if(this.phase==='vs' && this.vsAlpha>0){
      ctx.save();
      ctx.globalAlpha=this.vsAlpha;
      // Attacker name left
      ctx.fillStyle='#4a9eff';ctx.font='bold 22px sans-serif';ctx.textAlign='right';
      ctx.fillText(this.attacker.name,cw/2-40,ch/2-10);
      // VS
      var vsSc=1+0.1*Math.sin(this.timer*0.01);
      ctx.save();ctx.translate(cw/2,ch/2-5);ctx.scale(vsSc,vsSc);
      ctx.fillStyle='#ffd700';ctx.font='bold 36px sans-serif';ctx.textAlign='center';
      ctx.shadowColor='rgba(255,215,0,0.6)';ctx.shadowBlur=12;
      ctx.fillText('VS',0,0);ctx.restore();
      // Defender name right
      ctx.fillStyle='#ff5555';ctx.font='bold 22px sans-serif';ctx.textAlign='left';
      ctx.fillText(this.defender.name,cw/2+40,ch/2-10);
      // Weapon names
      var aw=this.attacker.getEquippedWeapon(), dw=this.defender.getEquippedWeapon();
      ctx.font='14px sans-serif';
      if(aw){ctx.fillStyle='#ccc';ctx.textAlign='right';ctx.fillText(aw.name,cw/2-40,ch/2+18);}
      if(dw){ctx.fillStyle='#ccc';ctx.textAlign='left';ctx.fillText(dw.name,cw/2+40,ch/2+18);}
      ctx.shadowBlur=0;
      ctx.restore();
    }
    this._renderFx(ctx,cw,ch);
    if(this.fadeAlpha>0){ctx.fillStyle='rgba(0,0,0,'+this.fadeAlpha+')';ctx.fillRect(-10,-10,cw+20,ch+20);}
    ctx.restore();
  }

  _drawTerrainLabel(ctx, ter, x, y) {
    var names={plain:'平原',forest:'森林',mountain:'山地',wall:'城牆',gate:'城門',river:'河川',village:'村莊',throne:'王座',pillar:'柱子',fort:'砦',floor:'石板',hill:'山丘',ruins:'廢墟',brazier:'火炬台',stairs:'樓梯',road:'道路',bridge:'橋樑',desert:'沙漠'};
    var name=names[ter]||ter;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(x,y,100,20);
    ctx.fillStyle='#bc9';ctx.font='12px sans-serif';ctx.textAlign='center';
    ctx.fillText(name,x+50,y+14);
    ctx.restore();
  }

  // Background is static for the whole battle (terrain fixed), so paint the
  // scenery once into an offscreen canvas and blit it each frame.
  _drawBg(ctx, ter, w, h) {
    var key = ter + '_' + w + 'x' + h;
    if (this._bgKey !== key || !this._bgCanvas) {
      this._bgCanvas = this._bgCanvas || document.createElement('canvas');
      this._bgCanvas.width = w; this._bgCanvas.height = h;
      this._paintBg(this._bgCanvas.getContext('2d'), ter, w, h);
      this._bgKey = key;
    }
    ctx.drawImage(this._bgCanvas, 0, 0);
  }

  _paintBg(ctx, ter, w, h) {
    // Normalize lookalike terrains into a visual group.
    var grp = ({ sea:'river', cliff:'mountain', road:'plain', basin:'plain',
      pass:'plain', bridge:'plain', stairs:'floor', brazier:'floor' })[ter] || ter;
    var pal = {
      plain:['#7ec0ee','#a8d8f0','#cfe6b8','#b1d493'], hill:['#86c6ee','#b0dcef','#cfe6b0','#9ec882'],
      forest:['#9fcbe6','#bfe0d2','#3a6a3a','#244a24'], mountain:['#5a6a8a','#8a9ab0','#b0a890','#6a5a4a'],
      river:['#7fb0d8','#a8cce4','#bcd8e8','#6f9ab8'], desert:['#e6c878','#f0dca0','#f5e8c0','#d8b070'],
      fort:['#6a7080','#8a90a0','#9a8a7a','#5a5560'], wall:['#161628','#23233a','#2e2e46','#1c1c30'],
      gate:['#161628','#23233a','#2e2e46','#1c1c30'], village:['#f0b878','#f3d0a0','#e0c088','#bf9468'],
      floor:['#2a2236','#3a3050','#443a5a','#2e2640'], pillar:['#2a2236','#3a3050','#443a5a','#2e2640'],
      throne:['#2a2236','#3a3050','#443a5a','#2e2640'], ruins:['#7a7a86','#9a9aa2','#9a948a','#6e686a'],
      swamp:['#5a6a52','#6a7a5a','#4a5a3a','#36402e']
    };
    var stops = pal[grp] || ['#4a7aaa','#6a9aca','#5a8a5a','#4a7a4a'];
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, stops[0]); g.addColorStop(0.42, stops[1]);
    g.addColorStop(0.72, stops[2]); g.addColorStop(1, stops[3]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    var hz = h * 0.6;
    var rand = function (n) { var x = Math.sin(n * 127.1 + ter.length * 13.7) * 43758.5453; return x - Math.floor(x); };
    var clouds = function (col, count, yb, sc) {
      ctx.fillStyle = col;
      for (var i = 0; i < count; i++) {
        var cx = rand(i * 3.3) * (w + 200) - 100, cy = yb + rand(i * 7.7) * h * 0.12, s = sc * (0.7 + rand(i * 5.1) * 0.7);
        ctx.beginPath(); ctx.arc(cx, cy, 26 * s, 0, 7); ctx.arc(cx + 30 * s, cy + 6 * s, 20 * s, 0, 7);
        ctx.arc(cx - 30 * s, cy + 8 * s, 18 * s, 0, 7); ctx.arc(cx + 8 * s, cy - 12 * s, 18 * s, 0, 7); ctx.fill();
      }
    };
    var hillBand = function (col, by, amp, per, ph) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, by);
      for (var x = 0; x <= w; x += 8) ctx.lineTo(x, by - Math.sin(x / per + ph) * amp - Math.sin(x / (per * 0.37) + ph) * amp * 0.3);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    };
    var ridge = function (col, by, amp, seed) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, by);
      var x = 0, n = 0; while (x <= w) { ctx.lineTo(x, by - (0.25 + rand(seed + n) * 0.75) * amp); x += w / 8; n++; }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    };
    var treeline = function (col, by, ht, step) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, by);
      for (var x = -step; x <= w + step; x += step) {
        var tx = x + rand(x) * step * 0.3, th = ht * (0.6 + rand(x * 1.7) * 0.7);
        ctx.lineTo(tx - step * 0.5, by); ctx.lineTo(tx, by - th); ctx.lineTo(tx + step * 0.5, by);
      }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    };
    var glow = function (cx, cy, r, col) {
      var rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      rg.addColorStop(0, col); rg.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    };

    switch (grp) {
      case 'plain': {
        clouds('rgba(255,255,255,0.85)', 4, h * 0.14, 1);
        glow(w * 0.78, h * 0.2, 130, 'rgba(255,250,210,0.7)');
        hillBand('#86b36a', hz - 8, 22, 120, 0.5); hillBand('#6fa056', hz + 8, 30, 90, 2.1);
        break;
      }
      case 'hill': {
        clouds('rgba(255,255,255,0.8)', 3, h * 0.12, 1.1);
        hillBand('#8fc06e', hz - 30, 40, 140, 0.3); hillBand('#74a857', hz - 4, 46, 100, 1.6);
        hillBand('#5e8f46', hz + 20, 40, 80, 3.0);
        break;
      }
      case 'forest': {
        glow(w * 0.32, h * 0.1, 220, 'rgba(190,225,140,0.4)');
        treeline('rgba(70,120,80,0.55)', hz - 18, 70, 46);
        treeline('rgba(34,74,34,0.85)', hz + 6, 100, 60);
        treeline('#163a16', hz + 34, 130, 84);
        break;
      }
      case 'mountain': {
        clouds('rgba(222,228,238,0.55)', 3, h * 0.1, 1.2);
        ridge('#7b8aa8', hz - 26, h * 0.30, 11); ridge('#5e6d8a', hz - 2, h * 0.36, 23);
        ridge('#3e4a63', hz + 22, h * 0.42, 31);
        ctx.fillStyle = 'rgba(240,245,255,0.9)';
        for (var i = 0; i < 5; i++) { var px = w * (0.12 + i * 0.2), pk = hz - 2 - h * 0.30 * (0.55 + rand(11 + i) * 0.4); ctx.beginPath(); ctx.moveTo(px, pk); ctx.lineTo(px - 15, pk + h * 0.07); ctx.lineTo(px + 15, pk + h * 0.07); ctx.fill(); }
        break;
      }
      case 'river': {
        hillBand('#6fa056', hz - 14, 16, 110, 1.0);
        var wy = hz; var wg = ctx.createLinearGradient(0, wy, 0, h);
        wg.addColorStop(0, '#5a86b0'); wg.addColorStop(0.5, '#74a6cc'); wg.addColorStop(1, '#456a8e');
        ctx.fillStyle = wg; ctx.fillRect(0, wy, w, h - wy);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
        for (var i = 0; i < 9; i++) { var ry = wy + 12 + i * ((h - wy) / 9); ctx.beginPath(); for (var x = 0; x <= w; x += 14) ctx.lineTo(x, ry + Math.sin(x / 24 + i) * 2); ctx.stroke(); }
        break;
      }
      case 'desert': {
        glow(w * 0.7, h * 0.16, 100, 'rgba(255,245,200,0.95)');
        hillBand('#e0c074', hz - 14, 18, 160, 0.4); hillBand('#d0aa5e', hz + 4, 26, 120, 1.8);
        hillBand('#be9550', hz + 26, 24, 90, 3.2);
        break;
      }
      case 'fort': case 'wall': case 'gate': {
        var sy = hz - 8, indoor = (grp !== 'fort');
        ctx.fillStyle = indoor ? '#2e2e40' : '#5a5560'; ctx.fillRect(0, sy, w, h - sy);
        ctx.fillStyle = indoor ? '#3a3a52' : '#6a6470';
        for (var x = 0; x < w; x += 48) ctx.fillRect(x, sy - 16, 28, 16);
        ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.5;
        for (var yy = sy, row = 0; yy < h; yy += 24, row++) {
          ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
          for (var x = (row % 2) * 32; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + 24); ctx.stroke(); }
        }
        if (indoor) {
          for (var k = 0; k < 2; k++) { var tx = w * (k ? 0.82 : 0.18); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(tx - 3, sy - 40, 6, 30); glow(tx, sy - 44, 42, 'rgba(255,180,70,0.9)'); }
        } else {
          ctx.fillStyle = '#7a2e2e'; ctx.fillRect(w * 0.5 - 5, sy - 54, 10, 48);
          ctx.fillStyle = '#b54545'; ctx.beginPath(); ctx.moveTo(w * 0.5 - 18, sy - 50); ctx.lineTo(w * 0.5 + 18, sy - 50); ctx.lineTo(w * 0.5 + 18, sy - 26); ctx.lineTo(w * 0.5, sy - 34); ctx.lineTo(w * 0.5 - 18, sy - 26); ctx.fill();
        }
        break;
      }
      case 'village': {
        clouds('rgba(255,240,210,0.7)', 3, h * 0.12, 1);
        var roofs = [[0.1, 0.0], [0.28, 0.05], [0.5, -0.03], [0.7, 0.05], [0.9, 0.0]];
        for (var r = 0; r < roofs.length; r++) {
          var rx = w * roofs[r][0], rw = w * 0.15, rh = h * (0.14 + roofs[r][1]);
          ctx.fillStyle = '#7a5a3a'; ctx.fillRect(rx - rw / 2, hz - rh * 0.5, rw, rh + 30);
          ctx.fillStyle = '#9a4a3a'; ctx.beginPath(); ctx.moveTo(rx - rw * 0.62, hz - rh * 0.5); ctx.lineTo(rx, hz - rh * 1.05); ctx.lineTo(rx + rw * 0.62, hz - rh * 0.5); ctx.fill();
          ctx.fillStyle = 'rgba(210,210,210,0.45)'; ctx.beginPath(); ctx.arc(rx + rw * 0.3, hz - rh * 1.1, 6, 0, 7); ctx.fill();
        }
        break;
      }
      case 'floor': case 'pillar': case 'throne': {
        if (ter === 'throne') glow(w * 0.5, hz * 0.62, 150, 'rgba(180,140,255,0.4)');
        var cols = [0.12, 0.34, 0.66, 0.88];
        for (var c = 0; c < cols.length; c++) {
          var px = w * cols[c];
          ctx.fillStyle = '#4a4258'; ctx.fillRect(px - 14, 0, 28, hz);
          ctx.fillStyle = '#5a5268'; ctx.fillRect(px - 18, 0, 8, hz);
          ctx.fillStyle = '#3a3248'; ctx.fillRect(px + 10, 0, 8, hz);
          ctx.fillStyle = '#6a6278'; ctx.fillRect(px - 20, 0, 40, 12); ctx.fillRect(px - 20, hz - 12, 40, 12);
        }
        break;
      }
      case 'ruins': {
        clouds('rgba(180,180,190,0.5)', 4, h * 0.12, 1.1);
        for (var i = 0; i < 5; i++) {
          var cx = w * (0.1 + i * 0.2) + rand(i) * 22, ch2 = hz * (0.35 + rand(i * 2) * 0.55);
          ctx.fillStyle = '#8a857a'; ctx.fillRect(cx - 10, hz - ch2, 20, ch2 + 20);
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(cx + 4, hz - ch2, 6, ch2 + 20);
          ctx.fillStyle = stops[1]; ctx.beginPath(); ctx.moveTo(cx - 11, hz - ch2); ctx.lineTo(cx + 11, hz - ch2); ctx.lineTo(cx + rand(i) * 18 - 9, hz - ch2 - 12); ctx.fill();
        }
        break;
      }
      case 'swamp': {
        hillBand('#3a4632', hz, 12, 100, 1.0);
        ctx.strokeStyle = '#2a2a22';
        for (var i = 0; i < 4; i++) {
          var tx = w * (0.15 + i * 0.24); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx, hz); ctx.lineTo(tx + rand(i) * 20 - 10, hz - h * 0.3); ctx.stroke();
          ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, hz - h * 0.18); ctx.lineTo(tx + 18, hz - h * 0.26); ctx.moveTo(tx, hz - h * 0.12); ctx.lineTo(tx - 16, hz - h * 0.2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(200,210,190,0.16)'; ctx.fillRect(0, hz - 20, w, 44);
        break;
      }
      default: {
        clouds('rgba(255,255,255,0.7)', 3, h * 0.14, 1);
        hillBand('#6fa056', hz + 4, 24, 100, 1.2);
      }
    }
  }

  _drawPlat(ctx, w, h) {
    var gy=h*0.65;
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(0,gy,w,3);
    var g=ctx.createLinearGradient(0,gy,0,h);g.addColorStop(0,'rgba(0,0,0,0.2)');g.addColorStop(1,'rgba(0,0,0,0.5)');
    ctx.fillStyle=g;ctx.fillRect(0,gy,w,h-gy);
  }

  _getOffscreen(w, h) {
    if (!this._off) this._off = document.createElement('canvas');
    if (this._off.width !== w || this._off.height !== h) {
      this._off.width = w; this._off.height = h;
    }
    return this._off;
  }

  _drawUnit(ctx, unit, x, y, size, facing, striking, flash) {
    if (flash > 0) {
      var off = this._getOffscreen(size * 3, size * 3);
      var oc = off.getContext('2d');
      oc.clearRect(0, 0, off.width, off.height);
      var ox = size, oy = size;
      this._drawUnit(oc, unit, ox, oy, size, facing, striking, 0);
      var fa = Math.min(1, flash / 260) * 0.75;
      oc.globalCompositeOperation = 'source-atop';
      oc.fillStyle = 'rgba(255,255,255,' + fa + ')';
      oc.fillRect(0, 0, off.width, off.height);
      oc.globalCompositeOperation = 'source-over';
      ctx.drawImage(off, x - ox, y - oy);
      return;
    }
    var c=Sprites.getUnitColors(unit.faction);
    var hr=unit.portrait?unit.portrait.hair:c.accent;
    var ey=unit.portrait?unit.portrait.eyes:'#222';
    var sk=(unit.portrait&&unit.portrait.skin)?unit.portrait.skin:c.skin;
    var fl=facing==='left'?-1:1, sc=size/16;
    ctx.save(); ctx.translate(x+size/2,y+size); ctx.scale(fl,1);
    var cls=getClassData(unit.classId), tags=cls.tags||[];
    if(tags.includes('mounted')||tags.includes('flying')){
      var fly=tags.includes('flying');
      ctx.fillStyle=fly?'#8888cc':'#aa8866';
      ctx.fillRect(-5*sc,-2.5*sc,10*sc,3.5*sc);
      ctx.fillStyle=fly?'#6666aa':'#886644';
      ctx.fillRect(-5*sc,0,1.5*sc,2*sc);ctx.fillRect(-2*sc,0,1.5*sc,2*sc);
      ctx.fillRect(1.5*sc,0,1.5*sc,2*sc);ctx.fillRect(4*sc,0,1.5*sc,2*sc);
      ctx.fillStyle=fly?'#8888cc':'#aa8866';
      ctx.fillRect(5*sc,-5*sc,3*sc,4*sc);ctx.fillRect(-6.5*sc,-4*sc,2*sc,2.5*sc);
      if(fly){ctx.fillStyle='rgba(150,150,220,0.6)';
        ctx.beginPath();ctx.moveTo(-1*sc,-3*sc);ctx.lineTo(-9*sc,-12*sc);ctx.lineTo(-5*sc,-2*sc);ctx.fill();
        ctx.beginPath();ctx.moveTo(1*sc,-3*sc);ctx.lineTo(3*sc,-11*sc);ctx.lineTo(5*sc,-2*sc);ctx.fill();}
    }
    ctx.fillStyle=c.armor;
    ctx.fillRect(-3*sc,-3*sc,2.5*sc,3*sc);ctx.fillRect(0.5*sc,-3*sc,2.5*sc,3*sc);
    ctx.fillStyle='#333';ctx.fillRect(-3*sc,-0.8*sc,2.5*sc,0.8*sc);ctx.fillRect(0.5*sc,-0.8*sc,2.5*sc,0.8*sc);
    ctx.fillStyle=c.body;ctx.fillRect(-4*sc,-10*sc,8*sc,7*sc);
    ctx.fillStyle=c.armor;ctx.fillRect(-3.5*sc,-9.5*sc,7*sc,3*sc);
    ctx.fillStyle='#654';ctx.fillRect(-4*sc,-3.5*sc,8*sc,0.8*sc);
    ctx.fillStyle=c.accent;ctx.fillRect(-4*sc,-10*sc,8*sc,0.5*sc);
    ctx.fillStyle=c.body;ctx.fillRect(-5.5*sc,-9*sc,2*sc,5*sc);
    if(striking){ctx.fillRect(3*sc,-10*sc,2*sc,4*sc);ctx.fillStyle=sk;ctx.fillRect(3.2*sc,-10.5*sc,1.6*sc,1.5*sc);}
    else{ctx.fillRect(3.5*sc,-9*sc,2*sc,5*sc);ctx.fillStyle=sk;ctx.fillRect(3.7*sc,-4.5*sc,1.6*sc,1.5*sc);}
    ctx.fillStyle=sk;ctx.fillRect(-1*sc,-11*sc,2*sc,1.5*sc);
    ctx.fillStyle=sk;ctx.fillRect(-3*sc,-15.5*sc,6*sc,5*sc);
    ctx.fillStyle=hr;ctx.fillRect(-3.5*sc,-16.5*sc,7*sc,3*sc);
    ctx.fillRect(-3.5*sc,-15*sc,1.5*sc,4*sc);ctx.fillRect(2*sc,-15*sc,1.5*sc,3*sc);ctx.fillRect(-4*sc,-14*sc,1*sc,5*sc);
    ctx.fillStyle='#fff';ctx.fillRect(-1.5*sc,-14*sc,1.8*sc,1.2*sc);ctx.fillRect(0.5*sc,-14*sc,1.8*sc,1.2*sc);
    ctx.fillStyle=ey;ctx.fillRect(-0.8*sc,-13.8*sc,1*sc,1*sc);ctx.fillRect(1.2*sc,-13.8*sc,1*sc,1*sc);
    ctx.fillStyle='#111';ctx.fillRect(-0.5*sc,-13.6*sc,0.5*sc,0.6*sc);ctx.fillRect(1.5*sc,-13.6*sc,0.5*sc,0.6*sc);
    ctx.fillStyle='#da9';ctx.fillRect(0.5*sc,-13*sc,0.8*sc,1*sc);
    ctx.fillStyle='#c88';ctx.fillRect(-0.5*sc,-11.5*sc,2*sc,0.5*sc);
    if(unit.isBoss){ctx.fillStyle='#ffd700';ctx.fillRect(-2.5*sc,-17.5*sc,5*sc,1.5*sc);
      ctx.fillRect(-2.5*sc,-18.5*sc,1*sc,1*sc);ctx.fillRect(-0.5*sc,-19*sc,1*sc,1.5*sc);ctx.fillRect(1.5*sc,-18.5*sc,1*sc,1*sc);}
    this._drawWpn(ctx,unit,sc,striking);
    ctx.restore();
  }

  _drawWpn(ctx, unit, sc, striking) {
    const cls = getClassData(unit.classId), weps = cls.weapons||[];
    const wpn = unit.getEquippedWeapon();
    const wt = wpn ? wpn.type : (weps[0]||'sword');
    const mag = ['fire','thunder','wind','dark','light'].includes(wt);
    if (wt==='sword') {
      if(striking){ctx.fillStyle='#ccc';ctx.fillRect(4*sc,-15*sc,1*sc,9*sc);
        ctx.fillStyle='#eee';ctx.fillRect(4.2*sc,-15*sc,0.6*sc,7*sc);
        ctx.fillStyle='#aa8833';ctx.fillRect(3.5*sc,-6.5*sc,2*sc,1*sc);}
      else{ctx.fillStyle='#ccc';ctx.fillRect(4.5*sc,-9*sc,1*sc,8*sc);
        ctx.fillStyle='#aa8833';ctx.fillRect(4*sc,-9*sc,2*sc,1*sc);}
    } else if (wt==='lance') {
      if(striking){ctx.fillStyle='#aa8866';ctx.fillRect(3*sc,-16*sc,0.8*sc,14*sc);
        ctx.fillStyle='#ccc';ctx.fillRect(2.6*sc,-17.5*sc,1.6*sc,2.5*sc);}
      else{ctx.fillStyle='#aa8866';ctx.fillRect(5*sc,-13*sc,0.8*sc,14*sc);
        ctx.fillStyle='#ccc';ctx.fillRect(4.6*sc,-14.5*sc,1.6*sc,2.5*sc);}
    } else if (wt==='axe') {
      if(striking){ctx.fillStyle='#886644';ctx.fillRect(3.5*sc,-14*sc,1*sc,10*sc);
        ctx.fillStyle='#aaa';ctx.fillRect(2*sc,-15*sc,4*sc,3*sc);}
      else{ctx.fillStyle='#886644';ctx.fillRect(5*sc,-10*sc,1*sc,10*sc);
        ctx.fillStyle='#aaa';ctx.fillRect(3.5*sc,-11*sc,4*sc,3*sc);}
    } else if (wt==='bow') {
      ctx.save();ctx.strokeStyle='#a86';ctx.lineWidth=1.5*sc;
      if(striking){ctx.beginPath();ctx.arc(5*sc,-8*sc,5*sc,-1.2,1.2);ctx.stroke();
        ctx.fillStyle='#ccc';ctx.fillRect(5*sc,-16*sc,0.5*sc,8*sc);
        ctx.fillStyle='#aaa';ctx.beginPath();ctx.moveTo(5.25*sc,-17*sc);ctx.lineTo(4.5*sc,-15.5*sc);ctx.lineTo(6*sc,-15.5*sc);ctx.fill();}
      else{ctx.beginPath();ctx.arc(6*sc,-7*sc,4*sc,-1.2,1.2);ctx.stroke();}
      ctx.restore();
    } else if (wt==='staff') {
      ctx.fillStyle='#ff8';ctx.fillRect(5*sc,-14*sc,1*sc,12*sc);
      ctx.fillStyle='#ffa';ctx.fillRect(4.5*sc,-15.5*sc,2*sc,2*sc);
      ctx.fillStyle='#fff';ctx.fillRect(5*sc,-16*sc,1*sc,1*sc);
    } else if (mag) {
      var mc={fire:'#f84',thunder:'#8af',wind:'#8f8',dark:'#a6f',light:'#ffa'}[wt]||'#f84';
      if(striking){ctx.fillStyle=mc;ctx.beginPath();ctx.arc(5*sc,-10*sc,3*sc,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(4*sc,-11*sc,1*sc,0,Math.PI*2);ctx.fill();}
      else{ctx.fillStyle=mc;ctx.beginPath();ctx.arc(6*sc,-6*sc,2*sc,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(5.5*sc,-7*sc,0.7*sc,0,Math.PI*2);ctx.fill();}
    }
  }

  _drawHP(ctx, unit, hp, px, py, isRight, cw) {
    var pw=270, ph=130;
    ctx.fillStyle='rgba(10,10,30,0.85)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='rgba(100,100,200,0.5)';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);
    ctx.strokeStyle='rgba(80,80,180,0.3)';ctx.strokeRect(px+3,py+3,pw-6,ph-6);
    ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.textAlign='left';
    ctx.fillText(unit.name,px+12,py+25);
    ctx.fillStyle='#aac';ctx.font='14px sans-serif';
    ctx.fillText('Lv '+unit.level,px+pw-60,py+25);
    // HP bar
    ctx.fillStyle='#444';ctx.fillRect(px+12,py+35,246,12);
    ctx.strokeStyle='rgba(100,100,200,0.4)';ctx.strokeRect(px+12,py+35,246,12);
    var hpRatio=Math.max(0,Math.min(1,hp/unit.maxHp));
    var barW=244*hpRatio;
    var barColor=hpRatio>0.5?'#4c4':hpRatio>0.25?'#cc4':'#c44';
    ctx.fillStyle=barColor;ctx.fillRect(px+13,py+36,barW,10);
    ctx.fillStyle='#aac';ctx.font='12px sans-serif';ctx.textAlign='right';
    ctx.fillText(Math.floor(hp)+'/'+unit.maxHp,px+pw-12,py+50);
    // Weapon info
    var wpn=unit.getEquippedWeapon();
    if(wpn){
      ctx.fillStyle='#fa8';ctx.font='bold 12px sans-serif';ctx.textAlign='left';
      ctx.fillText(wpn.name,px+12,py+70);
      var atk=wpn.atk+(wpn.magic?unit.mag:unit.str);
      ctx.fillStyle='#8f8';ctx.font='11px monospace';ctx.fillText('攻:'+atk,px+12,py+85);
      ctx.fillStyle='#8ef';ctx.fillText('重:'+wpn.weight,px+80,py+85);
    }
    ctx.fillStyle='#888';ctx.font='10px sans-serif';
    var durText=wpn?'\u8015:'+wpn.usesLeft+'/'+wpn.uses:'\u6c92\u6709\u6b66\u5668';
    ctx.fillText(durText,px+12,py+100);
    // Hit rate & Crit rate from forecast
    if(this.forecast){
      var fc=isRight?(this.forecast.defender.canCounter?this.forecast.defender:null):this.forecast.attacker;
      ctx.font='11px monospace';ctx.textAlign='left';
      if(fc){
        ctx.fillStyle='#8f8';ctx.fillText('命中:'+fc.hit+'%',px+12,py+116);
        ctx.fillStyle='#ff8';ctx.fillText('必殺:'+fc.crit+'%',px+100,py+116);
      } else {
        ctx.fillStyle='#555';ctx.fillText('命中: -',px+12,py+116);
        ctx.fillStyle='#555';ctx.fillText('必殺: -',px+100,py+116);
      }
    }
  }

  _renderFx(ctx,cw,ch){
    for(var e of this.effects){
      var alpha=Math.max(0,1-(e.timer/e.duration));
      ctx.globalAlpha=alpha;
      if(e.type==='damage'){
        var y=e.y-(e.timer*0.08)*ch;
        ctx.fillStyle=e.color;ctx.font='bold 24px sans-serif';ctx.textAlign='center';
        ctx.fillText(e.text,e.x,y);
      } else if(e.type==='miss'){
        var y=e.y-(e.timer*0.05)*ch;
        ctx.fillStyle=e.color;ctx.font='bold 20px sans-serif';ctx.textAlign='center';
        ctx.fillText(e.text,e.x,y);
      } else if(e.type==='crit'){
        var sc=1+Math.sin(e.timer*0.01)*0.1;
        ctx.save();ctx.translate(e.x,e.y);ctx.scale(sc,sc);
        ctx.fillStyle=e.color;ctx.font='bold 32px sans-serif';ctx.textAlign='center';
        ctx.shadowColor='rgba(255,215,0,0.8)';ctx.shadowBlur=10;
        ctx.fillText(e.text,0,0);ctx.restore();
      } else if(e.type==='defeat'){
        var sc=0.5+Math.sin(e.timer*0.01)*0.3;
        ctx.fillStyle=e.color;ctx.font='bold 48px sans-serif';ctx.textAlign='center';
        ctx.save();ctx.translate(cw/2,ch/2);ctx.scale(sc,sc);
        ctx.shadowColor='rgba(255,68,68,0.8)';ctx.shadowBlur=15;
        ctx.fillText(e.text,0,0);ctx.restore();
      } else if(e.type==='flash'){
        ctx.fillStyle=e.color;ctx.fillRect(0,0,cw,ch);
      } else if(e.type==='hitpct'){
        ctx.fillStyle=e.color;ctx.font='bold 14px sans-serif';ctx.textAlign='center';
        ctx.fillText(e.text,e.x,e.y);
      }
    }
    ctx.globalAlpha=1;
  }
}

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
    this.atkSwing = 0;
    this.defSwing = 0;
    this.projProg = -1;
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
    this.atkSwing = 0; this.defSwing = 0;
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
          this.effects.push({type:'shatter',side:'def',duration:700,timer:0});
        }
        if(this.attackerTargetHP<=0 && !this.attackerDead) {
          this.attackerDead=true; this.effects.push({type:'defeat',x:0,y:0,text:'撃破！',color:'#ff4444',duration:1200,timer:0});
          this.effects.push({type:'shatter',side:'atk',duration:700,timer:0});
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
    // weapon swing: wind-up (-1) -> strike-through (+1) -> settle (0)
    var sw = (t < 0.3) ? -this._eo(t / 0.3)
           : (t < 0.5) ? (-1 + 2 * this._ei((t - 0.3) / 0.2))
           : (t < 0.75) ? (1 - this._eo((t - 0.5) / 0.25)) : 0;
    if (a) { this.atkSwing = sw; this.defSwing = 0; } else { this.defSwing = sw; this.atkSwing = 0; }
    this._critSwing = !!s.crit;
    var aw = (a ? this.attacker : this.defender).getEquippedWeapon();
    var ranged = aw && (aw.type === 'bow' || ['fire','thunder','wind','dark','light'].includes(aw.type));
    this.strikeActorIsA = a; this.projType = aw ? aw.type : '';
    var L = ranged ? 14 : 50;          // ranged barely steps; melee lunges in
    var K = (s.crit ? 30 : 20);        // knockback on the struck unit
    if (t<0.3) { var d=this._eo(t/0.3); if(a) this.attackerAnimOffset=d*L; else this.defenderAnimOffset=-d*L; }
    else if (t<0.5) {
      if(a) this.attackerAnimOffset=L; else this.defenderAnimOffset=-L;
      // ranged impact lands with the projectile (t≈0.46), melee on contact (t≈0.3)
      if(!this.hitTriggered && (!ranged || t>=0.45)){this.hitTriggered=true;this._hit(s,a);}
    } else if (t<0.75) {
      var r=(t-0.5)/0.25;
      if(a) this.attackerAnimOffset=L*(1-this._ei(r)); else this.defenderAnimOffset=-L*(1-this._ei(r));
      if(s.hit){var kk=Math.sin(r*Math.PI); if(a) this.defenderAnimOffset=K*kk; else this.attackerAnimOffset=-K*kk;}
    } else { this.attackerAnimOffset=0; this.defenderAnimOffset=0; }
    this.projProg = (ranged && t>=0.22 && t<0.46) ? (t-0.22)/0.24 : -1;
    // dodge: on a miss the target sidesteps away instead of standing still
    if (!s.hit && t>=0.3 && t<0.62) { var dgo=Math.sin((t-0.3)/0.32*Math.PI)*22; if(a) this.defenderAnimOffset=dgo; else this.attackerAnimOffset=-dgo; }
  }

  _hit(s, a) {
    var tx=a?560:240, ty=240;
    if(!s.hit){this.effects.push({type:'miss',x:tx,y:ty,text:'MISS',color:'#999',duration:800,timer:0});if(typeof SFX!=='undefined')SFX.miss();return;}
    var aw=(a?this.attacker:this.defender).getEquippedWeapon();
    if(aw && (aw.type==='sword'||aw.type==='axe'||aw.type==='lance')) this.effects.push({type:'slash',x:tx,y:330,dir:a?1:-1,color:s.crit?'#ffe680':'#ffffff',duration:240,timer:0});
    this.effects.push({type:'sparks',x:tx,y:330,color:s.crit?'#ffe066':'#ffd0a0',n:s.crit?16:9,duration:s.crit?720:460,timer:0});
    if(aw && ['fire','thunder','wind','dark','light'].includes(aw.type)) this.effects.push({type:'spellFx',spell:aw.type,x:tx,y:330,duration:s.crit?760:580,timer:0});
    if(s.crit){
      this.effects.push({type:'flash',x:0,y:0,text:'',color:'#ffff00',duration:250,timer:0});
      this.effects.push({type:'flash',x:0,y:0,text:'',color:'#ffffff',duration:100,timer:0});
      this.effects.push({type:'crit',x:400,y:160,text:'必殺！',color:'#ffd700',duration:1000,timer:0});
      this.effects.push({type:'ring',x:tx,y:330,color:'#ffd700',duration:420,timer:0});
      if(aw) this.effects.push({type:'critFlair',wt:aw.type,x:tx,y:330,dir:a?1:-1,duration:380,timer:0});
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
    var bobA=Math.sin(this.timer*0.006)*2, bobD=Math.sin(this.timer*0.006+1.7)*2; // idle breathing
    var atkWin=this.phase==='result'&&this.defenderDead&&!this.attackerDead;       // victory pose
    var defWin=this.phase==='result'&&this.attackerDead&&!this.defenderDead;
    var vbA=atkWin?-Math.abs(Math.sin(this.timer*0.009))*7:(atkS?0:bobA);
    var vbD=defWin?-Math.abs(Math.sin(this.timer*0.009))*7:(defS?0:bobD);
    if(!this.attackerDead||this.deathAlpha>0){
      ctx.save(); if(this.attackerDead){ctx.globalAlpha=this.deathAlpha;ctx.translate(0,this.deathFall);}
      this._drawUnit(ctx,this.attacker,ax-sz/2,gy-sz+vbA,sz,'right',atkS||atkWin,this.attackerFlash,atkS?this.atkSwing:0); ctx.restore();
    }
    if(!this.defenderDead||this.deathAlpha>0){
      ctx.save(); if(this.defenderDead){ctx.globalAlpha=this.deathAlpha;ctx.translate(0,this.deathFall);}
      this._drawUnit(ctx,this.defender,dx-sz/2,gy-sz+vbD,sz,'left',defS||defWin,this.defenderFlash,defS?this.defSwing:0); ctx.restore();
    }
    if((atkS||defS) && this.projProg>=0){
      var srcX=this.strikeActorIsA?ax:dx, tgtX=this.strikeActorIsA?dx:ax;
      var pjx=srcX+(tgtX-srcX)*this.projProg, pjy=gy-sz*0.5-Math.sin(this.projProg*Math.PI)*8, pdir=this.strikeActorIsA?1:-1;
      if(this.projType==='bow'){
        ctx.save();ctx.translate(pjx,pjy);ctx.scale(pdir,1);
        ctx.fillStyle='#caa';ctx.fillRect(-12,-1.5,16,3);
        ctx.fillStyle='#eee';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(2,-3.5);ctx.lineTo(2,3.5);ctx.fill();
        ctx.fillStyle='#a55';ctx.fillRect(-12,-3,3,6);
        ctx.restore();
      } else {
        var mc={fire:'#ff7a3a',thunder:'#7ab8ff',wind:'#8ff0a0',dark:'#b070ff',light:'#ffe680'}[this.projType]||'#ff7a3a';
        ctx.globalAlpha=0.4;ctx.fillStyle=mc;ctx.beginPath();ctx.arc(pjx-pdir*12,pjy,5,0,7);ctx.fill();ctx.globalAlpha=1;
        ctx.fillStyle=mc;ctx.beginPath();ctx.arc(pjx,pjy,7,0,7);ctx.fill();
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(pjx-pdir*2,pjy-1,2.5,0,7);ctx.fill();
      }
    }
    if(this.panelAlpha>0){
      ctx.globalAlpha=this.panelAlpha;
      this._drawHP(ctx,this.attacker,this.attackerHP,20,ch-150,false,cw,this.attackerTargetHP);
      this._drawHP(ctx,this.defender,this.defenderHP,cw-290,ch-150,true,cw,this.defenderTargetHP);
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
    var names={plain:'平原',forest:'森林',mountain:'山地',wall:'城牆',gate:'城門',river:'河川',village:'村莊',throne:'王座',pillar:'柱子',fort:'砦',floor:'石板',hill:'山丘',ruins:'廢墟',brazier:'火炬台',stairs:'樓梯',road:'道路',bridge:'橋樑',desert:'沙漠',sea:'海',swamp:'沼澤',cliff:'懸崖',pass:'山道',basin:'窪地'};
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
    // Most terrains render distinctly; a few lookalikes share a renderer.
    var grp = ({ road: 'plain', basin: 'plain', pass: 'mountain', bridge: 'river',
      stairs: 'floor', pillar: 'floor', brazier: 'throne' })[ter] || ter;
    // palette: [skyTop, skyMid, farGround, nearGround]
    var pal = {
      plain:    ['#5aa6e8', '#9fd2f2', '#bfe3a4', '#8cc06c'],
      hill:     ['#549ce2', '#9ecdf0', '#c2e2a2', '#79ab5a'],
      forest:   ['#7fb4cc', '#c2e2d6', '#41763f', '#1d401f'],
      mountain: ['#465c86', '#8ea6c6', '#a2b2c8', '#585866'],
      river:    ['#64a2d8', '#a6cdee', '#9fc996', '#3c6c9c'],
      sea:      ['#4a8ec6', '#8cc0e6', '#5b9bc6', '#1f4a72'],
      desert:   ['#e8b85a', '#f5dd9e', '#f6e6b4', '#d0a558'],
      fort:     ['#6a80a0', '#9fb2cc', '#7a7468', '#4c4852'],
      wall:     ['#0e0e1c', '#1f1f38', '#2a2a46', '#141426'],
      gate:     ['#120f20', '#241b3c', '#2d2346', '#160f24'],
      village:  ['#e89a58', '#f6cb8e', '#cba06e', '#946c44'],
      floor:    ['#221c32', '#332e4c', '#3e3858', '#221d34'],
      throne:   ['#281e3e', '#3c2d5e', '#48386c', '#221836'],
      ruins:    ['#888fa2', '#bcc2cd', '#9c968c', '#605a5e'],
      swamp:    ['#475850', '#5c6c58', '#384834', '#1f2a1e'],
      cliff:    ['#6a80a2', '#a4bace', '#7c7066', '#443c3a'],
    };
    var stops = pal[grp] || pal.plain;
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, stops[0]); sky.addColorStop(0.4, stops[1]);
    sky.addColorStop(0.66, stops[2]); sky.addColorStop(1, stops[3]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    var hz = h * 0.6;
    var rand = function (n) { var x = Math.sin(n * 127.1 + ter.length * 13.7) * 43758.5453; return x - Math.floor(x); };
    var glow = function (cx, cy, r, col) {
      var rg = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      rg.addColorStop(0, col); rg.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    };
    var clouds = function (col, count, yb, sc) {
      ctx.fillStyle = col;
      for (var i = 0; i < count; i++) {
        var cx = rand(i * 3.3) * (w + 200) - 100, cy = yb + rand(i * 7.7) * h * 0.1, s = sc * (0.7 + rand(i * 5.1) * 0.7);
        ctx.beginPath(); ctx.arc(cx, cy, 26 * s, 0, 7); ctx.arc(cx + 30 * s, cy + 6 * s, 20 * s, 0, 7);
        ctx.arc(cx - 30 * s, cy + 8 * s, 18 * s, 0, 7); ctx.arc(cx + 8 * s, cy - 12 * s, 18 * s, 0, 7); ctx.fill();
      }
    };
    var sun = function (cx, cy, r, core, halo) {
      glow(cx, cy, r * 2.6, halo);
      ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = core; ctx.lineWidth = 2;
      for (var i = 0; i < 12; i++) { var a = i / 12 * 6.283 + 0.2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 1.4); ctx.lineTo(cx + Math.cos(a) * r * 2.2, cy + Math.sin(a) * r * 2.2); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    };
    var stars = function (count, col) {
      ctx.fillStyle = col;
      for (var i = 0; i < count; i++) { var sx = rand(i * 2.1) * w, sy = rand(i * 9.3) * hz * 0.8, s = 0.5 + rand(i * 4.7) * 1.3; ctx.globalAlpha = 0.4 + rand(i * 6.1) * 0.6; ctx.fillRect(sx, sy, s, s); }
      ctx.globalAlpha = 1;
    };
    var birds = function (count, yb) {
      ctx.strokeStyle = 'rgba(40,50,70,0.5)'; ctx.lineWidth = 1.5;
      for (var i = 0; i < count; i++) { var bx = rand(i * 8.1) * w, by = yb + rand(i * 3.7) * h * 0.16, s = 4 + rand(i * 5.5) * 4; ctx.beginPath(); ctx.moveTo(bx - s, by); ctx.quadraticCurveTo(bx, by - s * 0.7, bx + 1, by); ctx.quadraticCurveTo(bx + 2, by - s * 0.7, bx + s + 2, by); ctx.stroke(); }
    };
    var hillBand = function (col, by, amp, per, ph) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, by);
      for (var x = 0; x <= w; x += 8) ctx.lineTo(x, by - Math.sin(x / per + ph) * amp - Math.sin(x / (per * 0.37) + ph) * amp * 0.3);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    };
    var ridgePts = function (by, amp, seed) {
      var pts = [], x = 0, n = 0; while (x <= w + 1) { pts.push({ x: x, y: by - (0.22 + rand(seed + n * 1.7) * 0.78) * amp }); x += w / 9; n++; } return pts;
    };
    var ridge = function (col, pts) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    };
    var snowcaps = function (pts, depth, col) {
      ctx.fillStyle = col;
      for (var i = 1; i < pts.length - 1; i++) {
        var p = pts[i]; if (p.y > pts[i - 1].y || p.y > pts[i + 1].y) continue;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - depth, p.y + depth); ctx.lineTo(p.x, p.y + depth * 0.5); ctx.lineTo(p.x + depth, p.y + depth); ctx.closePath(); ctx.fill();
      }
    };
    var treeline = function (col, by, ht, step) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, by);
      for (var x = -step; x <= w + step; x += step) {
        var tx = x + rand(x) * step * 0.3, th = ht * (0.6 + rand(x * 1.7) * 0.7);
        ctx.lineTo(tx - step * 0.5, by); ctx.lineTo(tx, by - th); ctx.lineTo(tx + step * 0.5, by);
      }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    };
    var water = function (wy, top, bot) {
      var wg = ctx.createLinearGradient(0, wy, 0, h); wg.addColorStop(0, top); wg.addColorStop(1, bot);
      ctx.fillStyle = wg; ctx.fillRect(0, wy, w, h - wy);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
      for (var i = 0; i < 10; i++) { var ry = wy + 8 + i * ((h - wy) / 10); ctx.globalAlpha = 0.5 - i * 0.03; ctx.beginPath(); for (var x = 0; x <= w; x += 14) ctx.lineTo(x, ry + Math.sin(x / 22 + i * 1.3) * 2.2); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (var j = 0; j < 30; j++) { ctx.globalAlpha = rand(j * 3.1) * 0.5; ctx.fillRect(rand(j * 1.3) * w, wy + rand(j * 7.9) * (h - wy), 2, 1); }
      ctx.globalAlpha = 1;
    };
    var mist = function (yb, n, col) {
      ctx.fillStyle = col;
      for (var i = 0; i < n; i++) { ctx.globalAlpha = 0.1 + rand(i * 4.3) * 0.12; ctx.beginPath(); ctx.ellipse(rand(i * 2.7) * w, yb + i * 10 - n * 5, w * (0.3 + rand(i) * 0.3), 12, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    };
    var fireflies = function (count, col) {
      for (var i = 0; i < count; i++) glow(rand(i * 5.7) * w, hz * 0.4 + rand(i * 2.3) * hz * 0.5, 5 + rand(i) * 5, col);
    };
    var trees = function (by, count, col, scale) {
      ctx.fillStyle = col;
      for (var i = 0; i < count; i++) {
        var tx = rand(i * 6.3) * w, s = scale * (0.7 + rand(i * 2.9) * 0.6);
        ctx.fillRect(tx - 1, by - 12 * s, 2, 12 * s);
        ctx.beginPath(); ctx.arc(tx, by - 15 * s, 6 * s, 0, 7); ctx.arc(tx - 5 * s, by - 11 * s, 5 * s, 0, 7); ctx.arc(tx + 5 * s, by - 11 * s, 5 * s, 0, 7); ctx.fill();
      }
    };
    var dust = function (count, col, yTop) {
      ctx.fillStyle = col;
      for (var i = 0; i < count; i++) { ctx.globalAlpha = 0.2 + rand(i * 3.7) * 0.5; ctx.fillRect(rand(i * 1.9) * w, (yTop || 0) + rand(i * 8.3) * (h - (yTop || 0)), 2, 2); }
      ctx.globalAlpha = 1;
    };
    var masonry = function (sy, base, cren) {
      ctx.fillStyle = base; ctx.fillRect(0, sy, w, h - sy);
      ctx.fillStyle = cren; for (var x = 0; x < w; x += 48) ctx.fillRect(x, sy - 16, 28, 16);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
      for (var yy = sy, row = 0; yy < h; yy += 24, row++) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); for (var x = (row % 2) * 32; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + 24); ctx.stroke(); } }
    };
    var archWindow = function (cx, cy, rw, rh, col) {
      ctx.fillStyle = '#0c0a14'; ctx.beginPath(); ctx.moveTo(cx - rw, cy + rh); ctx.lineTo(cx - rw, cy); ctx.quadraticCurveTo(cx, cy - rh, cx + rw, cy); ctx.lineTo(cx + rw, cy + rh); ctx.closePath(); ctx.fill();
      var lg = ctx.createLinearGradient(0, cy - rh, 0, cy + rh); lg.addColorStop(0, col); lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(cx - rw + 3, cy + rh); ctx.lineTo(cx - rw + 3, cy); ctx.quadraticCurveTo(cx, cy - rh + 4, cx + rw - 3, cy); ctx.lineTo(cx + rw - 3, cy + rh); ctx.closePath(); ctx.fill();
      glow(cx, cy + rh + 26, rw * 2, col.replace(/[\d.]+\)$/, '0.3)'));
    };
    var banner = function (cx, top, len, col) {
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(cx - 2, top, 4, len + 8);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 14, top + 6); ctx.lineTo(cx + 14, top + 6); ctx.lineTo(cx + 14, top + len); ctx.lineTo(cx, top + len - 12); ctx.lineTo(cx - 14, top + len); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,235,150,0.85)'; ctx.beginPath(); ctx.arc(cx, top + len * 0.5, 4, 0, 7); ctx.fill();
    };
    var vignette = function () {
      var vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.82);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.32)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    };

    switch (grp) {
      case 'plain': {
        sun(w * 0.8, h * 0.2, 30, '#fff6d2', 'rgba(255,248,205,0.8)');
        clouds('rgba(255,255,255,0.9)', 3, h * 0.12, 1.1); clouds('rgba(255,255,255,0.5)', 2, h * 0.24, 0.8);
        birds(3, h * 0.3);
        hillBand('#8fc274', hz - 18, 26, 150, 0.4); hillBand('#74ab58', hz - 2, 30, 110, 1.7); hillBand('#5f9446', hz + 22, 34, 80, 3.0);
        trees(hz + 16, 6, '#4f7e3a', 1);
        break;
      }
      case 'hill': {
        sun(w * 0.18, h * 0.16, 26, '#fff4cc', 'rgba(255,244,200,0.7)');
        clouds('rgba(255,255,255,0.85)', 3, h * 0.1, 1.1);
        hillBand('#9ecb7a', hz - 40, 44, 170, 0.3); hillBand('#82b863', hz - 14, 50, 120, 1.5);
        hillBand('#67a04c', hz + 12, 48, 90, 2.7); hillBand('#52883c', hz + 38, 40, 70, 4.0);
        trees(hz + 6, 5, '#436e30', 1.1);
        break;
      }
      case 'forest': {
        glow(w * 0.3, h * 0.04, 240, 'rgba(200,235,150,0.45)');
        ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#eaffc0';
        for (var i = 0; i < 5; i++) { var lx = w * (0.14 + i * 0.18); ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + 40, 0); ctx.lineTo(lx + 92, hz); ctx.lineTo(lx + 28, hz); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        treeline('rgba(80,130,90,0.5)', hz - 26, 70, 46); treeline('rgba(42,90,46,0.82)', hz - 2, 100, 60); treeline('#163a18', hz + 28, 135, 86);
        mist(hz + 6, 3, '#cfe6cf'); fireflies(6, 'rgba(220,255,150,0.7)');
        break;
      }
      case 'mountain': {
        clouds('rgba(220,228,240,0.5)', 3, h * 0.08, 1.3); birds(2, h * 0.22);
        var p1 = ridgePts(hz - 28, h * 0.34, 11); ridge('#7a8aa8', p1); snowcaps(p1, 14, 'rgba(244,248,255,0.92)');
        var p2 = ridgePts(hz - 2, h * 0.40, 23); ridge('#5c6c8a', p2); snowcaps(p2, 16, 'rgba(232,240,252,0.85)');
        ridge('#3e4a63', ridgePts(hz + 26, h * 0.46, 31));
        dust(50, 'rgba(255,255,255,0.7)');
        break;
      }
      case 'river': {
        sun(w * 0.74, h * 0.18, 24, '#fff4cc', 'rgba(255,244,200,0.6)');
        clouds('rgba(255,255,255,0.8)', 2, h * 0.12, 1);
        hillBand('#74ab58', hz - 16, 18, 120, 1.0); hillBand('#5f9446', hz - 2, 16, 90, 2.4);
        water(hz, '#5a86b0', '#3a5a80');
        ctx.strokeStyle = '#3a5a32'; ctx.lineWidth = 2;
        for (var i = 0; i < 14; i++) { var rx = rand(i * 2.3) * w; ctx.beginPath(); ctx.moveTo(rx, hz + 2); ctx.lineTo(rx + rand(i) * 6 - 3, hz - 12 - rand(i * 3) * 10); ctx.stroke(); }
        break;
      }
      case 'sea': {
        sun(w * 0.5, h * 0.2, 28, '#fff0c0', 'rgba(255,240,192,0.7)');
        clouds('rgba(255,255,255,0.7)', 3, h * 0.1, 1.2);
        water(hz - 10, '#3f86bc', '#173f64');
        ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffeeb0';
        for (var i = 0; i < 8; i++) { var gy = hz - 10 + i * ((h - hz + 10) / 8); ctx.fillRect(w * 0.5 - (4 + i * 3), gy, 8 + i * 6, 2); }
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (var j = 0; j < 18; j++) ctx.fillRect(rand(j * 3.7) * w, hz - 8 + rand(j * 5.1) * (h - hz), 5 + rand(j) * 6, 1.5);
        birds(3, h * 0.16);
        break;
      }
      case 'desert': {
        sun(w * 0.72, h * 0.16, 30, '#fff2c0', 'rgba(255,238,180,0.95)');
        ctx.fillStyle = 'rgba(255,240,200,0.15)'; ctx.fillRect(0, hz - 30, w, 60);
        // distant layered mesa / butte
        ctx.fillStyle = 'rgba(176,128,82,0.55)'; ctx.fillRect(w * 0.12, hz - 48, 56, 48); ctx.fillRect(w * 0.12 - 18, hz - 30, 18, 30); ctx.fillRect(w * 0.12 + 56, hz - 36, 22, 36);
        ctx.fillStyle = 'rgba(140,98,60,0.4)'; ctx.fillRect(w * 0.12 + 42, hz - 48, 14, 48);
        hillBand('#eccd80', hz - 12, 22, 180, 0.4); hillBand('#dcb968', hz + 6, 30, 130, 1.7); hillBand('#c8a052', hz + 30, 28, 95, 3.1);
        // dune crest highlight + heat shimmer
        ctx.strokeStyle = 'rgba(255,246,212,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); for (var x = 0; x <= w; x += 8) ctx.lineTo(x, hz + 6 - Math.sin(x / 130 + 1.7) * 30 - Math.sin(x / 48 + 1.7) * 9); ctx.stroke();
        ctx.fillStyle = 'rgba(255,250,225,0.12)'; for (var i = 0; i < 3; i++) ctx.fillRect(0, hz - 8 + i * 6, w, 2);
        dust(28, 'rgba(235,210,160,0.55)', hz - 60);
        break;
      }
      case 'fort': {
        masonry(hz - 6, '#5a5560', '#6a6470');
        banner(w * 0.5, hz - 60, 52, '#b54545');
        for (var k = 0; k < 2; k++) { var tx = w * (k ? 0.85 : 0.15); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(tx - 3, hz - 44, 6, 32); glow(tx, hz - 48, 40, 'rgba(255,180,70,0.85)'); }
        break;
      }
      case 'wall': {
        stars(40, '#cfe0ff'); masonry(hz - 6, '#23233a', '#2e2e48');
        for (var k = 0; k < 3; k++) { var tx = w * (0.2 + k * 0.3); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(tx - 3, hz - 44, 6, 30); glow(tx, hz - 46, 46, 'rgba(255,170,60,0.9)'); }
        break;
      }
      case 'gate': {
        stars(30, '#cfe0ff'); masonry(hz - 6, '#23233a', '#2e2e48');
        ctx.fillStyle = '#0a0812'; ctx.beginPath(); ctx.moveTo(w * 0.5 - 50, h); ctx.lineTo(w * 0.5 - 50, hz - 30); ctx.quadraticCurveTo(w * 0.5, hz - 72, w * 0.5 + 50, hz - 30); ctx.lineTo(w * 0.5 + 50, h); ctx.closePath(); ctx.fill();
        glow(w * 0.5, h * 0.82, 80, 'rgba(255,150,60,0.4)');
        ctx.strokeStyle = '#3a3550'; ctx.lineWidth = 3;
        for (var x = w * 0.5 - 46; x <= w * 0.5 + 46; x += 14) { ctx.beginPath(); ctx.moveTo(x, hz - 24); ctx.lineTo(x, h); ctx.stroke(); }
        for (var k = 0; k < 2; k++) { var tx = w * (k ? 0.78 : 0.22); glow(tx, hz - 30, 40, 'rgba(255,170,60,0.85)'); }
        break;
      }
      case 'village': {
        sun(w * 0.82, h * 0.14, 22, '#ffe7b0', 'rgba(255,220,150,0.6)');
        clouds('rgba(255,240,210,0.7)', 3, h * 0.12, 1);
        var roofs = [[0.1, 0.0], [0.3, 0.06], [0.52, -0.02], [0.72, 0.06], [0.92, 0.0]];
        for (var r = 0; r < roofs.length; r++) {
          var rx = w * roofs[r][0], rw = w * 0.16, rh = h * (0.15 + roofs[r][1]);
          ctx.fillStyle = '#7a5a3a'; ctx.fillRect(rx - rw / 2, hz - rh * 0.5, rw, rh + 40);
          ctx.fillStyle = 'rgba(255,210,120,0.9)'; ctx.fillRect(rx - 5, hz - rh * 0.2, 10, 12);
          ctx.fillStyle = '#9a4a3a'; ctx.beginPath(); ctx.moveTo(rx - rw * 0.62, hz - rh * 0.5); ctx.lineTo(rx, hz - rh * 1.08); ctx.lineTo(rx + rw * 0.62, hz - rh * 0.5); ctx.fill();
          var chx = rx + rw * 0.3; ctx.fillStyle = '#5a4030'; ctx.fillRect(chx, hz - rh * 1.0, 7, 14);
          ctx.fillStyle = 'rgba(220,220,220,0.5)';
          for (var s = 0; s < 4; s++) { ctx.globalAlpha = 0.5 - s * 0.1; ctx.beginPath(); ctx.arc(chx + 3 + Math.sin(s) * 6, hz - rh * 1.0 - 8 - s * 14, 6 + s * 2, 0, 7); ctx.fill(); }
          ctx.globalAlpha = 1;
        }
        break;
      }
      case 'floor': {
        archWindow(w * 0.22, hz * 0.32, 40, 80, 'rgba(120,170,230,0.7)');
        archWindow(w * 0.78, hz * 0.32, 40, 80, 'rgba(230,150,120,0.7)');
        var cols = [0.1, 0.36, 0.64, 0.9];
        for (var c = 0; c < cols.length; c++) {
          var px = w * cols[c];
          ctx.fillStyle = '#4a4258'; ctx.fillRect(px - 14, 0, 28, hz);
          ctx.fillStyle = '#5a5268'; ctx.fillRect(px - 18, 0, 8, hz);
          ctx.fillStyle = '#3a3248'; ctx.fillRect(px + 10, 0, 8, hz);
          ctx.fillStyle = '#6a6278'; ctx.fillRect(px - 20, 0, 40, 12); ctx.fillRect(px - 20, hz - 12, 40, 12);
        }
        break;
      }
      case 'throne': {
        glow(w * 0.5, hz * 0.5, 180, 'rgba(170,120,255,0.45)');
        archWindow(w * 0.5, hz * 0.26, 52, 96, 'rgba(180,140,255,0.75)');
        var cols2 = [0.14, 0.86];
        for (var c = 0; c < cols2.length; c++) { var px = w * cols2[c]; ctx.fillStyle = '#4a4258'; ctx.fillRect(px - 16, 0, 32, hz); ctx.fillStyle = '#5a5268'; ctx.fillRect(px - 20, 0, 8, hz); ctx.fillStyle = '#6a6278'; ctx.fillRect(px - 22, 0, 44, 12); }
        banner(w * 0.3, 4, 70, '#5a3a8a'); banner(w * 0.7, 4, 70, '#5a3a8a');
        ctx.fillStyle = '#2a2238'; ctx.fillRect(w * 0.5 - 50, hz - 60, 100, 60); ctx.fillStyle = '#3a3050'; ctx.fillRect(w * 0.5 - 36, hz - 90, 72, 36);
        break;
      }
      case 'ruins': {
        clouds('rgba(190,190,200,0.5)', 4, h * 0.12, 1.1); birds(2, h * 0.2);
        for (var i = 0; i < 6; i++) {
          var cx = w * (0.08 + i * 0.17) + rand(i) * 20, ch2 = hz * (0.3 + rand(i * 2) * 0.6);
          ctx.fillStyle = '#9a958a'; ctx.fillRect(cx - 11, hz - ch2, 22, ch2 + 20);
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(cx + 5, hz - ch2, 6, ch2 + 20);
          ctx.fillStyle = stops[1]; ctx.beginPath(); ctx.moveTo(cx - 12, hz - ch2); ctx.lineTo(cx + 12, hz - ch2); ctx.lineTo(cx + rand(i) * 16 - 8, hz - ch2 - 12); ctx.fill();
          ctx.strokeStyle = 'rgba(70,110,60,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 6, hz - ch2 + 6); ctx.lineTo(cx - 6 + rand(i) * 8 - 4, hz - ch2 * 0.4); ctx.stroke();
        }
        mist(hz + 6, 2, '#cfcfc8');
        dust(22, 'rgba(210,210,200,0.45)', hz - 80);
        break;
      }
      case 'swamp': {
        ctx.fillStyle = 'rgba(60,80,60,0.3)'; ctx.fillRect(0, 0, w, hz);
        hillBand('#3a4632', hz - 6, 14, 110, 1.0);
        water(hz + 6, '#3a4a38', '#1e2a1c');
        ctx.strokeStyle = '#241f1a';
        for (var i = 0; i < 5; i++) {
          var tx = w * (0.12 + i * 0.2); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx, hz + 6); ctx.lineTo(tx + rand(i) * 20 - 10, hz - h * 0.32); ctx.stroke();
          ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, hz - h * 0.2); ctx.lineTo(tx + 20, hz - h * 0.28); ctx.moveTo(tx, hz - h * 0.13); ctx.lineTo(tx - 18, hz - h * 0.22); ctx.stroke();
        }
        mist(hz, 4, '#b8c4b0'); fireflies(7, 'rgba(180,255,140,0.7)');
        break;
      }
      case 'cliff': {
        clouds('rgba(220,228,240,0.5)', 3, h * 0.08, 1.2);
        ridge('#8090ac', ridgePts(hz + 30, h * 0.2, 7));
        ctx.fillStyle = '#5a5048'; ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w * 0.62, 0); ctx.lineTo(w * 0.7, h); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4a423c'; ctx.beginPath(); ctx.moveTo(w * 0.62, 0); ctx.lineTo(w * 0.66, 0); ctx.lineTo(w * 0.74, h); ctx.lineTo(w * 0.7, h); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
        for (var i = 1; i < 7; i++) { var sy = h * i / 7; ctx.beginPath(); ctx.moveTo(w * (0.64 + i * 0.01), sy); ctx.lineTo(w, sy + 10); ctx.stroke(); }
        ctx.fillStyle = '#4a423c'; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * 0.7); ctx.lineTo(w * 0.16, h * 0.78); ctx.lineTo(w * 0.2, h); ctx.closePath(); ctx.fill();
        break;
      }
      default: {
        clouds('rgba(255,255,255,0.7)', 3, h * 0.14, 1);
        hillBand('#6fa056', hz + 4, 24, 100, 1.2);
      }
    }
    vignette();
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

  _drawUnit(ctx, unit, x, y, size, facing, striking, flash, swing) {
    if (flash > 0) {
      var off = this._getOffscreen(size * 3, size * 3);
      var oc = off.getContext('2d');
      oc.clearRect(0, 0, off.width, off.height);
      var ox = size, oy = size;
      this._drawUnit(oc, unit, ox, oy, size, facing, striking, 0, swing);
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
    ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(0,1*sc,6.5*sc,2*sc,0,0,7);ctx.fill();
    if(!this._drawFigure(ctx,unit,sc,striking,c,hr,ey,sk)){
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
    }
    if(unit.isBoss){ctx.fillStyle='#ffd700';ctx.fillRect(-2.5*sc,-17.5*sc,5*sc,1.5*sc);
      ctx.fillRect(-2.5*sc,-18.5*sc,1*sc,1*sc);ctx.fillRect(-0.5*sc,-19*sc,1*sc,1.5*sc);ctx.fillRect(1.5*sc,-18.5*sc,1*sc,1*sc);}
    this._drawWpn(ctx,unit,sc,striking,swing);
    ctx.restore();
  }

  _shade(col, f) {
    var c = col.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var n = parseInt(c, 16);
    var m = function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); };
    return 'rgb(' + m((n >> 16) & 255) + ',' + m((n >> 8) & 255) + ',' + m(n & 255) + ')';
  }

  // New-style figure painter (per-class silhouettes with shading + outline).
  // Returns false for unknown classes (legacy block painter as fallback).
  _drawFigure(ctx, unit, sc, striking, c, hr, ey, sk) {
    var cls = unit.classId || 'soldier';
    var ARCH = {
      knight: 'armored', general: 'armored', greatKnight: 'armored',
      mercenary: 'merc', swordmaster: 'merc', hero: 'merc',
      thief: 'rogue', assassin: 'rogue',
      lord: 'lord', masterLord: 'lord',
      soldier: 'soldier', cavalier: 'soldier', paladin: 'soldier',
      wyvernRider: 'soldier', wyvernLord: 'soldier', pegasusKnight: 'soldier', falconKnight: 'soldier',
      fighter: 'axe', warrior: 'axe', brigand: 'axe',
      archer: 'bow', sniper: 'bow', ranger: 'bow',
      mage: 'mage', sage: 'mage', mageKnight: 'mage', bishop: 'bishop',
      darkMage: 'dark', cleric: 'cleric', valkyrie: 'cleric',
      skeleton: 'bone'
    };
    var arche = ARCH[cls];
    if (!arche) return false;
    var cd = getClassData(cls) || {}; var tags = cd.tags || [];
    var mounted = tags.includes('mounted') || tags.includes('flying');
    var S = this._shade.bind(this);
    var F = function (x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x * sc, y * sc, w * sc, h * sc); };
    var OR = function (x, y, w, h, base) { F(x, y, w, h, '#15151f'); F(x + 0.25, y + 0.25, w - 0.5, h - 0.5, base); };
    var TRI = function (x1, y1, x2, y2, x3, y3, col) {
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x1 * sc, y1 * sc); ctx.lineTo(x2 * sc, y2 * sc); ctx.lineTo(x3 * sc, y3 * sc);
      ctx.closePath(); ctx.fill();
    };

    if (mounted) this._drawMount(ctx, sc, c, cls.indexOf('wyvern') === 0 ? 'wyvern' : (cls === 'pegasusKnight' || cls === 'falconKnight') ? 'pegasus' : 'horse');

    var robe = (arche === 'mage' || arche === 'bishop' || arche === 'dark' || arche === 'cleric');
    var bone = arche === 'bone';
    var robeCol = arche === 'cleric' ? S(c.body, 1.15) : arche === 'dark' ? S(c.body, 0.55) : c.body;
    var armCol = arche === 'armored' ? S(c.armor, 0.95) : bone ? '#d8d2c0' : robe ? robeCol : arche === 'axe' ? sk : c.body;
    var handCol = arche === 'armored' ? '#9aa2b2' : bone ? '#e6e0ce' : sk;

    // ---- back arm ----
    OR(-3.8, -10.0, bone ? 1.4 : 1.9, 4.8, S(armCol, 0.62));
    F(-3.5, -5.6, 1.2, 1.2, arche === 'armored' ? '#7e8696' : bone ? '#d8d2c0' : S(sk, 0.8));

    // ---- capes (behind torso) ----
    if (arche === 'merc') { TRI(-1.0, -10.9, -4.7, -5.0, -1.9, -5.4, S(c.cloth, 0.55)); TRI(-1.0, -10.9, -4.2, -5.2, -1.9, -5.5, S(c.cloth, 0.78)); }
    if (arche === 'lord') { TRI(-0.6, -11.0, -5.0, -3.4, -1.6, -4.4, S(c.accent, 0.6)); TRI(-0.6, -11.0, -4.4, -3.8, -1.6, -4.6, S(c.accent, 0.85)); }
    if (arche === 'rogue' || cls === 'sniper') { TRI(-1.0, -10.9, -4.2, -6.0, -1.9, -5.8, S(c.body, 0.5)); }

    // ---- legs / lower half ----
    if (mounted) {
      F(-2.5, -6.5, 4.8, 1.5, c.cloth); F(-2.5, -5.2, 4.8, 0.4, S(c.cloth, 0.6));   // saddle blanket
      if (robe) { OR(-2.4, -6.8, 5.0, 3.4, robeCol); F(-2.1, -3.9, 4.4, 0.5, c.accent); }
      else {
        var legC = arche === 'armored' ? S(c.armor, 0.95) : S(c.cloth, 0.9);
        OR(0.9, -6.3, 2.2, 1.6, legC); OR(2.1, -5.2, 1.4, 2.6, S(legC, 1.05)); OR(1.9, -2.9, 2.1, 1.1, '#2e241c');
      }
    } else if (robe) {
      OR(-3.2, -11.0, 6.6, 10.5, robeCol);
      F(0.9, -10.7, 1.7, 9.6, S(robeCol, 1.22)); F(-2.9, -10.7, 1.1, 9.6, S(robeCol, 0.7));
      F(-2.9, -1.6, 6.0, 0.7, c.accent);                                            // hem
      F(-1.8, -0.8, 1.5, 0.8, '#2e241c'); F(0.8, -0.8, 1.5, 0.8, '#2e241c');        // shoe tips
      F(-2.9, -6.9, 6.0, 0.7, S(robeCol, 0.6));                                     // rope belt
    } else if (bone) {
      OR(-2.2, -5.9, 1.3, 5.9, '#d8d2c0'); OR(0.8, -5.7, 1.3, 5.7, '#cfc8b4');
      F(-2.1, -3.4, 1.1, 0.5, '#9a9484'); F(0.9, -3.2, 1.1, 0.5, '#9a9484');        // knee joints
      F(-2.5, -6.6, 5.4, 1.6, S(c.body, 0.8));                                      // tattered loincloth
      TRI(-2.5, -5.0, -1.2, -5.0, -2.0, -3.6, S(c.body, 0.8)); TRI(0.4, -5.0, 1.8, -5.0, 1.2, -3.8, S(c.body, 0.8));
    } else if (arche === 'armored') {
      OR(-2.7, -6.0, 2.5, 4.6, S(c.armor, 0.9)); OR(0.4, -5.7, 2.5, 4.3, c.armor);
      F(-2.4, -4.5, 1.9, 0.8, S(c.armor, 1.32)); F(0.7, -4.2, 1.9, 0.8, S(c.armor, 1.38));
      OR(-2.9, -2.0, 2.8, 2.1, '#3a4150'); OR(0.2, -2.1, 3.0, 2.2, '#454e60');
    } else {
      var pant = arche === 'axe' ? S('#7a5c3a', 0.95) : S(c.cloth, 0.9);
      OR(-2.5, -5.9, 2.2, 4.4, S(pant, 0.85)); OR(0.5, -5.6, 2.2, 4.1, pant);
      OR(-2.7, -1.9, 2.5, 2.0, '#2e241c'); OR(0.3, -2.0, 2.7, 2.1, '#3a2e22');
      F(-2.4, -1.7, 1.9, 0.5, '#4a3a2c'); F(0.6, -1.8, 2.1, 0.5, '#54422f');
    }

    // ---- armor skirt (ground armored only) ----
    if (arche === 'armored' && !mounted) {
      TRI(-3.3, -7.3, 3.6, -7.3, 2.9, -4.9, S(c.armor, 0.82));
      TRI(-3.3, -7.3, 2.9, -4.9, -2.6, -4.9, S(c.armor, 0.82));
      F(-3.0, -6.4, 6.3, 0.35, S(c.armor, 0.55));
    }

    // ---- torso ----
    if (arche === 'armored') {
      OR(-3.6, -11.3, 7.4, 5.3, c.armor);
      F(0.9, -11.0, 2.0, 4.4, S(c.armor, 1.32)); F(-3.3, -11.0, 1.3, 4.4, S(c.armor, 0.62));
      F(-0.7, -9.9, 1.5, 1.5, c.accent); F(-3.0, -7.1, 6.4, 0.5, S(c.armor, 1.18));
    } else if (robe) {
      if (mounted) { OR(-3.1, -11.0, 6.4, 4.6, robeCol); F(0.9, -10.7, 1.7, 3.9, S(robeCol, 1.22)); F(-2.8, -10.7, 1.1, 3.9, S(robeCol, 0.7)); }
      if (arche === 'bishop') { F(-2.0, -10.9, 1.0, 9.0, c.accent); F(1.1, -10.9, 1.0, 9.0, c.accent); }   // stole
      if (arche === 'cleric') { F(-0.55, -9.6, 1.2, 2.6, c.accent); F(-1.25, -8.9, 2.6, 1.1, c.accent); }  // cross
      F(-2.9, -11.0, 5.8, 0.7, S(robeCol, 1.3));                                                           // collar
    } else if (bone) {
      OR(-2.6, -10.9, 5.4, 4.6, '#231f28');
      F(-2.2, -10.4, 4.6, 0.7, '#d8d2c0'); F(-2.2, -9.2, 4.6, 0.7, '#cfc8b4'); F(-2.2, -8.0, 4.6, 0.7, '#c4bda8');
      F(-0.5, -10.6, 0.9, 4.0, '#cfc8b4');                                                                 // sternum
    } else if (arche === 'axe') {
      OR(-3.0, -11.0, 6.2, 5.6, sk);
      F(0.9, -10.7, 1.6, 4.7, S(sk, 1.12)); F(-2.7, -10.7, 1.1, 4.7, S(sk, 0.82));
      ctx.save(); ctx.translate(0, -8.3 * sc); ctx.rotate(0.55); F(-3.4, -0.5, 6.8, 1.0, '#5a4226'); ctx.restore();
      F(-2.8, -6.3, 5.8, 1.1, '#4e3a24'); F(0.0, -6.2, 1.2, 0.9, '#c9a23e');
      if (cls === 'warrior') { OR(1.7, -11.7, 2.7, 2.4, '#6b5340'); F(1.95, -11.45, 2.2, 0.6, '#7d6450'); }
    } else {
      OR(-3.1, -11.1, 6.4, 5.6, c.body);
      F(0.9, -10.8, 1.7, 4.7, S(c.body, 1.3)); F(-2.8, -10.8, 1.1, 4.7, S(c.body, 0.66));
      F(-2.8, -11.1, 5.8, 0.7, arche === 'lord' ? '#d9b24e' : c.accent);
      F(-2.8, -6.6, 5.8, 1.0, '#4e3a24'); F(0.1, -6.5, 1.0, 0.8, '#d9b24e');
      if (arche === 'bow') { F(-2.0, -10.6, 3.6, 4.0, '#7a5c3a'); F(-2.0, -10.6, 3.6, 0.6, S('#7a5c3a', 1.25)); }
      if (arche === 'soldier') F(-0.5, -10.2, 1.2, 1.2, c.accent);
    }

    // ---- quiver (bow classes, slung behind the shoulder) ----
    if (arche === 'bow') {
      ctx.save(); ctx.translate(-2.6 * sc, -10.2 * sc); ctx.rotate(0.5);
      OR(-0.8, -1.2, 1.6, 4.6, '#6b4e2e');
      F(-0.6, -2.0, 0.35, 1.0, '#cfd6e2'); F(0.1, -2.2, 0.35, 1.2, '#cfd6e2'); F(0.7, -1.9, 0.35, 0.9, '#cfd6e2');
      ctx.restore();
    }

    // ---- pauldrons ----
    if (arche === 'armored') {
      OR(-4.4, -11.9, 2.6, 2.6, S(c.armor, 0.88)); F(-4.15, -11.65, 2.1, 0.7, S(c.armor, 1.3));
      OR(1.8, -12.0, 2.9, 2.8, S(c.armor, 1.05)); F(2.05, -11.75, 2.4, 0.7, S(c.armor, 1.45));
    } else if (arche === 'merc' || arche === 'lord' || arche === 'soldier') {
      OR(2.0, -11.3, 2.3, 2.2, S(c.armor, 1.05)); F(2.25, -11.05, 1.8, 0.6, S(c.armor, 1.45));
    }

    // ---- front arm + hand (grips match the weapon pivot) ----
    if (striking) { OR(2.6, -11.0, bone ? 1.6 : 2.1, 3.9, armCol); F(3.2, -10.5, 1.6, 1.5, handCol); }
    else { OR(2.7, -9.4, bone ? 1.6 : 2.1, 5.2, armCol); F(3.7, -4.5, 1.6, 1.5, handCol); }
    if (arche === 'bow' && !striking) F(2.8, -7.2, 1.7, 0.9, '#7a5c3a');            // bracer

    // ---- head ----
    if (arche === 'armored') {
      F(-1.3, -11.6, 2.9, 1.3, S(c.armor, 0.75));
      OR(-2.5, -15.9, 5.0, 5.0, S(c.armor, 1.08)); F(-2.25, -15.65, 4.5, 1.1, S(c.armor, 1.5));
      F(-1.9, -13.9, 3.8, 0.95, '#0e1218');
      F(-1.1, -13.75, 0.55, 0.6, '#dfe8f8'); F(0.65, -13.75, 0.55, 0.6, '#dfe8f8');
      F(-2.25, -12.6, 4.5, 0.55, S(c.armor, 0.75));
      F(-0.45, -17.5, 1.0, 1.9, c.accent); F(-0.45, -18.0, 1.0, 0.7, S(c.accent, 1.35));
    } else if (bone) {
      OR(-2.3, -15.5, 4.7, 4.6, '#e2dcc8'); F(1.5, -15.25, 0.6, 4.1, '#bdb6a0');
      F(-1.5, -13.9, 1.3, 1.3, '#171219'); F(0.5, -13.9, 1.3, 1.3, '#171219');      // sockets
      F(-1.2, -13.6, 0.5, 0.5, '#b5e8ff'); F(0.8, -13.6, 0.5, 0.5, '#b5e8ff');      // glints
      F(-0.35, -12.7, 0.8, 0.7, '#171219');                                          // nose
      F(-1.4, -11.6, 3.0, 0.4, '#9a9484');                                           // jaw
    } else if (arche === 'dark') {
      OR(-2.7, -16.0, 5.5, 5.3, robeCol);
      TRI(-2.7, -15.4, -3.9, -13.0, -2.7, -12.6, robeCol);
      F(-1.8, -14.7, 3.7, 3.5, '#140f1e');
      F(-1.2, -13.6, 1.0, 0.8, '#c07aff'); F(0.5, -13.6, 1.0, 0.8, '#c07aff');      // glowing eyes
    } else {
      F(-0.7, -11.5, 1.8, 1.1, S(sk, 0.85));                                         // neck
      OR(-2.4, -15.6, 4.9, 4.7, sk); F(1.7, -15.35, 0.55, 4.2, S(sk, 0.86));
      var hooded = (cls === 'sniper' || arche === 'rogue');
      if (arche === 'soldier') {
        OR(-2.6, -16.1, 5.3, 2.4, S(c.armor, 1.05));                                 // helmet dome
        F(-3.0, -13.9, 6.1, 0.8, S(c.armor, 1.3));                                   // brim
      } else if (arche === 'cleric') {
        F(-2.6, -16.2, 5.3, 1.6, '#eceaf2'); F(-2.6, -15.0, 1.0, 3.9, '#e0deea'); F(1.7, -15.0, 1.0, 3.9, '#e0deea'); // wimple
      } else if (arche === 'mage') {
        F(-2.3, -15.3, 4.7, 0.9, hr);
        F(-3.3, -15.2, 6.8, 0.9, '#15151f'); F(-3.15, -15.05, 6.5, 0.6, S(robeCol, 0.85)); // brim
        TRI(-2.3, -15.0, 0.2, -19.2, 2.9, -15.0, S(robeCol, 0.95));                  // cone
        F(-1.7, -15.9, 3.4, 0.75, c.accent);                                         // band
        if (cls === 'sage') F(0.0, -17.6, 0.7, 0.7, '#ffe07a');
      } else if (arche === 'bishop') {
        F(-2.3, -16.1, 4.7, 1.3, '#eceaf2'); F(-2.3, -15.0, 4.7, 0.6, hr);           // skullcap
      } else if (hooded) {
        OR(-2.6, -16.1, 5.3, 3.0, S(c.body, 0.7));
        TRI(-2.6, -15.2, -3.7, -13.2, -2.6, -12.9, S(c.body, 0.7));
        if (arche === 'rogue') F(-1.7, -12.5, 3.5, 1.2, S(c.cloth, 0.75));           // face scarf
      } else if (cls === 'brigand') {
        F(-0.6, -17.2, 1.3, 2.2, hr); F(-2.4, -15.7, 1.0, 1.4, S(sk, 0.92)); F(1.5, -15.7, 1.0, 1.4, S(sk, 0.92)); // mohawk
      } else {
        F(-2.5, -16.3, 5.1, 1.9, hr); F(-2.7, -15.0, 1.2, 2.7, hr); F(1.9, -15.2, 1.0, 1.7, hr); F(0.2, -15.7, 1.5, 0.8, hr);
        if (arche === 'merc' || arche === 'axe') F(-2.3, -14.55, 4.7, 0.7, c.accent); // headband
        if (arche === 'lord') { F(-2.4, -14.9, 4.9, 0.6, '#f5cf4a'); F(-0.3, -15.15, 0.8, 0.95, '#ff6868'); } // circlet
      }
      var eyY = arche === 'soldier' ? -13.0 : -13.7;
      F(-1.1, eyY, 1.2, 1.0, '#fff'); F(0.6, eyY, 1.2, 1.0, '#fff');
      F(-0.6, eyY + 0.15, 0.6, 0.75, ey); F(1.1, eyY + 0.15, 0.6, 0.75, ey);
      if (!hooded) F(-0.2, eyY + 1.55, 1.0, 0.4, '#b07868');                         // mouth
    }
    return true;
  }

  // Mounts for cavalry / fliers: horse, wyvern, pegasus.
  _drawMount(ctx, sc, c, kind) {
    var S = this._shade.bind(this);
    var F = function (x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x * sc, y * sc, w * sc, h * sc); };
    var OR = function (x, y, w, h, base) { F(x, y, w, h, '#15151f'); F(x + 0.25, y + 0.25, w - 0.5, h - 0.5, base); };
    var TRI = function (x1, y1, x2, y2, x3, y3, col) {
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x1 * sc, y1 * sc); ctx.lineTo(x2 * sc, y2 * sc); ctx.lineTo(x3 * sc, y3 * sc);
      ctx.closePath(); ctx.fill();
    };
    if (kind === 'wyvern') {
      var wb = '#41705c';
      TRI(-1.2, -5.0, -9.2, -13.2, -4.4, -4.2, S(c.cloth, 0.5));                     // back wing
      ctx.strokeStyle = S(c.cloth, 0.35); ctx.lineWidth = Math.max(1, 0.45 * sc);
      ctx.beginPath(); ctx.moveTo(-1.4 * sc, -5.0 * sc); ctx.lineTo(-8.6 * sc, -12.6 * sc); ctx.stroke();
      TRI(-5.6, -4.4, -8.8, -1.2, -4.8, -1.6, S(wb, 0.8));                           // tail
      TRI(-8.4, -2.2, -9.8, -0.4, -7.4, -0.6, S(wb, 0.9));                           // tail spade
      OR(-5.6, -5.4, 10.4, 4.4, wb);
      F(-5.2, -2.8, 9.6, 1.4, '#c9c194');                                            // belly plates
      F(-5.2, -5.1, 9.6, 0.8, S(wb, 1.25));
      OR(-3.6, -1.8, 1.8, 2.0, S(wb, 0.85)); OR(1.7, -1.9, 1.9, 2.1, S(wb, 0.95));   // legs
      F(-3.5, -0.4, 1.6, 0.5, '#e8e2cc'); F(1.8, -0.4, 1.7, 0.5, '#e8e2cc');         // claws
      TRI(3.4, -5.4, 4.6, -9.6, 6.0, -4.6, wb);                                      // neck
      OR(3.9, -10.0, 3.1, 2.1, wb);
      F(6.4, -9.5, 1.2, 1.3, S(wb, 1.2));                                            // snout
      TRI(4.4, -10.0, 3.8, -11.6, 5.2, -10.0, '#ddd6ba'); TRI(5.4, -10.0, 5.0, -11.0, 6.0, -10.0, '#ccc4a8'); // horns
      F(5.4, -9.4, 0.6, 0.6, '#ffd24a');                                             // eye
      TRI(0.6, -5.4, 5.8, -13.0, 2.9, -4.4, c.cloth);                                // front wing
      ctx.strokeStyle = S(c.cloth, 0.6);
      ctx.beginPath(); ctx.moveTo(0.8 * sc, -5.2 * sc); ctx.lineTo(5.3 * sc, -12.4 * sc); ctx.stroke();
    } else {
      var hb = kind === 'pegasus' ? '#edeff6' : '#8a6a48';
      var mane = kind === 'pegasus' ? '#c9cedd' : S(hb, 0.55);
      if (kind === 'pegasus') {
        TRI(-1.0, -5.2, -8.6, -12.4, -4.0, -4.4, '#dfe3ee');                          // back wing
        ctx.strokeStyle = '#b9c0d4'; ctx.lineWidth = Math.max(1, 0.4 * sc);
        ctx.beginPath(); ctx.moveTo(-1.2 * sc, -5.0 * sc); ctx.lineTo(-8.0 * sc, -11.8 * sc); ctx.stroke();
      }
      TRI(-5.4, -4.6, -7.2, -1.2, -4.8, -2.2, mane);                                  // tail
      OR(-5.4, -5.0, 9.8, 3.8, hb);
      F(-5.0, -2.6, 9.0, 1.0, S(hb, 0.82)); F(-5.0, -4.7, 9.0, 0.7, S(hb, 1.18));
      var lx = [-4.6, -2.5, 1.7, 3.5];
      for (var i = 0; i < 4; i++) { OR(lx[i], -1.7, 1.15, 1.8, S(hb, 0.92)); F(lx[i] + 0.1, -0.5, 0.95, 0.55, '#241c12'); }
      TRI(3.2, -5.0, 4.3, -8.0, 5.6, -4.6, hb);                                       // neck
      OR(4.1, -8.4, 2.8, 2.0, hb);
      F(6.3, -7.9, 1.0, 1.2, S(hb, 1.15)); F(6.9, -7.3, 0.35, 0.35, '#1c1612');       // muzzle + nostril
      TRI(4.5, -8.4, 4.9, -9.4, 5.5, -8.4, hb);                                       // ear
      F(5.4, -7.9, 0.5, 0.5, '#181410');                                              // eye
      F(3.9, -8.6, 0.9, 3.4, mane); F(4.3, -8.9, 1.7, 0.6, mane);                     // mane
      F(-2.6, -5.6, 4.8, 1.2, c.cloth); F(-2.6, -4.5, 4.8, 0.4, S(c.cloth, 0.6));     // saddle
      F(-0.7, -4.4, 0.9, 2.9, '#54402a');                                             // girth
      if (kind === 'pegasus') {
        TRI(0.6, -5.2, 5.2, -12.0, 2.7, -4.4, '#f4f6fb');                             // front wing
        ctx.strokeStyle = '#c3cadf'; ctx.lineWidth = Math.max(1, 0.4 * sc);
        ctx.beginPath(); ctx.moveTo(0.8 * sc, -5.0 * sc); ctx.lineTo(4.8 * sc, -11.5 * sc); ctx.stroke();
      }
    }
  }

  _drawWpn(ctx, unit, sc, striking, swing) {
    const cls = getClassData(unit.classId), weps = cls.weapons||[];
    const wpn = unit.getEquippedWeapon();
    const wt = wpn ? wpn.type : (weps[0]||'sword');
    const mag = ['fire','thunder','wind','dark','light'].includes(wt);
    var melee = (wt==='sword'||wt==='axe'||wt==='lance');
    var rot = (striking && melee && swing) ? swing * (wt==='lance' ? 0.5 : 1.45) * (this._critSwing ? 1.3 : 1) : 0;
    var pvx=3.8*sc, pvy=-8*sc;
    var shape = function () {
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
    };
    if (rot) {
      // motion-blur afterimages trailing the blade through its arc
      [[0.66, 0.20], [0.33, 0.11]].forEach(function (g) {
        ctx.save(); ctx.globalAlpha = g[1]; ctx.translate(pvx, pvy); ctx.rotate(rot * g[0]); ctx.translate(-pvx, -pvy); shape(); ctx.restore();
      });
      ctx.save(); ctx.translate(pvx, pvy); ctx.rotate(rot); ctx.translate(-pvx, -pvy); shape(); ctx.restore();
    } else { shape(); }
  }

  _drawHP(ctx, unit, hp, px, py, isRight, cw, targetHp) {
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
    var tHp=(typeof targetHp==='number')?targetHp:hp;
    var curRatio=Math.max(0,Math.min(1,tHp/unit.maxHp));
    var dispRatio=Math.max(0,Math.min(1,hp/unit.maxHp));
    var barColor=curRatio>0.5?'#4c4':curRatio>0.25?'#cc4':'#c44';
    ctx.fillStyle='#f7f0b0';ctx.fillRect(px+13,py+36,244*dispRatio,10); // recently-lost HP trail
    ctx.fillStyle=barColor;ctx.fillRect(px+13,py+36,244*curRatio,10);
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
      } else if(e.type==='slash'){
        var pr=e.timer/e.duration; ctx.save(); ctx.translate(e.x,e.y); ctx.lineCap='round';
        ctx.globalAlpha=alpha*0.95; ctx.strokeStyle=e.color;
        ctx.lineWidth=6*(1-pr)+1; ctx.beginPath(); ctx.arc(0,0,30+pr*16,(-1.0)*e.dir,(1.0)*e.dir,e.dir<0); ctx.stroke();
        ctx.globalAlpha=alpha; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,30+pr*16,(-0.7)*e.dir,(0.7)*e.dir,e.dir<0); ctx.stroke();
        ctx.restore();
      } else if(e.type==='sparks'){
        var pr=e.timer/e.duration;
        for(var i=0;i<e.n;i++){
          var ang=(i/e.n)*6.283+i, dd=pr*(38+(i%4)*14);
          var sx=e.x+Math.cos(ang)*dd, sy=e.y+Math.sin(ang)*dd+pr*pr*34;
          ctx.globalAlpha=alpha*(1-pr); ctx.fillStyle=e.color;
          var rr=Math.max(1,3.5*(1-pr)); ctx.fillRect(sx-rr/2,sy-rr/2,rr,rr);
        }
      } else if(e.type==='ring'){
        var rp=e.timer/e.duration; ctx.globalAlpha=alpha*(1-rp*0.5); ctx.strokeStyle=e.color; ctx.lineWidth=4*(1-rp)+1;
        ctx.beginPath();ctx.arc(e.x,e.y,8+rp*46,0,7);ctx.stroke();
      } else if(e.type==='spellFx'){
        var sp=e.timer/e.duration; ctx.save(); ctx.translate(e.x,e.y);
        if(e.spell==='fire'){
          for(var k=0;k<3;k++){ ctx.globalAlpha=alpha*(1-sp)*0.9; ctx.fillStyle=['#ffe060','#ff8a30','#d8401a'][k]; ctx.beginPath();ctx.arc(0,0,sp*(16+k*16)+4,0,7);ctx.fill(); }
          ctx.fillStyle='#ffc060'; for(var i=0;i<8;i++){ var fa=i/8*6.283; var fd=sp*42; ctx.globalAlpha=alpha*(1-sp); ctx.fillRect(Math.cos(fa)*fd-1.5,Math.sin(fa)*fd-sp*26-1.5,3,3); }
        } else if(e.spell==='thunder'){
          if(sp<0.55){ ctx.globalAlpha=alpha; ctx.strokeStyle='#e6fbff'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(0,-e.y);
            var segs=9; for(var i=1;i<=segs;i++){ var yy=-e.y+e.y*(i/segs); var xx=(i===segs)?0:(Math.sin(i*13.7+sp*40)*(1-i/segs)*26); ctx.lineTo(xx,yy);} ctx.stroke();
            ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
            ctx.globalAlpha=alpha*0.6; ctx.fillStyle='#cdeaff'; ctx.beginPath();ctx.arc(0,0,16,0,7);ctx.fill(); }
        } else if(e.spell==='wind'){
          ctx.globalAlpha=alpha*(1-sp); ctx.strokeStyle='#8ff0a8'; ctx.lineWidth=3.5;
          for(var k=0;k<3;k++){ var wr=8+k*13+sp*22; ctx.beginPath(); ctx.arc(0,0,wr,-0.5+sp*0.8,1.0+sp*0.8); ctx.stroke(); }
        } else if(e.spell==='dark'){
          ctx.globalAlpha=alpha*(1-sp*0.4); ctx.fillStyle='#240a36'; ctx.beginPath();ctx.arc(0,0,(1-sp)*24+8,0,7);ctx.fill();
          ctx.strokeStyle='#b274ff'; ctx.lineWidth=2.5; ctx.globalAlpha=alpha*(1-sp);
          for(var i=0;i<8;i++){ var da=i/8*6.283+sp; var dd=10+sp*36; ctx.beginPath();ctx.moveTo(Math.cos(da)*6,Math.sin(da)*6);ctx.lineTo(Math.cos(da)*dd,Math.sin(da)*dd);ctx.stroke(); }
        } else if(e.spell==='light'){
          var LR=10+sp*42; var lg=ctx.createRadialGradient(0,0,1,0,0,LR); lg.addColorStop(0,'rgba(255,251,224,'+alpha+')'); lg.addColorStop(1,'rgba(255,230,120,0)'); ctx.fillStyle=lg; ctx.beginPath();ctx.arc(0,0,LR,0,7);ctx.fill();
          ctx.globalAlpha=alpha*(1-sp); ctx.strokeStyle='#fff3b0'; ctx.lineWidth=3;
          for(var i=0;i<4;i++){ var la=i/4*Math.PI; ctx.beginPath(); ctx.moveTo(-Math.cos(la)*LR,-Math.sin(la)*LR); ctx.lineTo(Math.cos(la)*LR,Math.sin(la)*LR); ctx.stroke(); }
        }
        ctx.restore();
      } else if(e.type==='critFlair'){
        var cp=e.timer/e.duration; ctx.save(); ctx.translate(e.x,e.y); ctx.globalAlpha=alpha; ctx.lineCap='round';
        if(e.wt==='sword'){ var R=26+cp*20; ctx.strokeStyle='#fff'; ctx.lineWidth=5*(1-cp)+1.5;
          ctx.beginPath();ctx.moveTo(-R,-R*0.8);ctx.lineTo(R,R*0.8);ctx.stroke();
          if(cp>0.18){ctx.beginPath();ctx.moveTo(R,-R*0.8);ctx.lineTo(-R,R*0.8);ctx.stroke();}
        } else if(e.wt==='axe'){ ctx.strokeStyle='#fff'; ctx.lineWidth=7*(1-cp)+2; ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(0,32);ctx.stroke();
          ctx.fillStyle='#c9b08c'; for(var i=0;i<11;i++){ var aa=Math.PI+(i/10)*Math.PI; var dd=cp*48; ctx.globalAlpha=alpha*(1-cp); ctx.fillRect(Math.cos(aa)*dd-1.5,30+Math.sin(aa)*dd*0.35-1.5,3,3);}
        } else if(e.wt==='lance'){ ctx.strokeStyle='#fff'; ctx.lineWidth=3.5*(1-cp)+1;
          for(var i=0;i<3;i++){ var yy=-14+i*14; var len=24+cp*34; ctx.beginPath();ctx.moveTo(-e.dir*len,yy);ctx.lineTo(e.dir*4,yy);ctx.stroke(); }
        } else if(e.wt==='bow'){ for(var i=0;i<3;i++){ var yy=-15+i*15; var px2=-e.dir*(46-cp*64); ctx.save();ctx.translate(px2,yy);ctx.scale(e.dir,1); ctx.fillStyle='#eee';ctx.fillRect(-11,-1,15,2); ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(0,-3);ctx.lineTo(0,3);ctx.fill(); ctx.restore(); } }
        ctx.restore();
      } else if(e.type==='shatter'){
        var hp2=e.timer/e.duration; var bx=(e.side==='def')?cw-180:180, by=ch*0.62-30; ctx.fillStyle='#cdd6e0';
        for(var i=0;i<16;i++){ var aa=i/16*6.283; var spd=0.6+(i%4)*0.22; var dd=hp2*64*spd; ctx.globalAlpha=alpha; var sz2=Math.max(1,4.5*(1-hp2)); ctx.fillRect(bx+Math.cos(aa)*dd-sz2/2, by+Math.sin(aa)*dd*0.6+hp2*hp2*80-sz2/2, sz2, sz2); }
      }
    }
    ctx.globalAlpha=1;
  }
}

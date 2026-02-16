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
    this.forecast = null;
    this.hitTriggered = false;
  }

  start(attacker, defender, combatResult, forecast, onComplete) {
    this.active = true;
    this.attacker = attacker;
    this.defender = defender;
    this.combatSteps = combatResult.steps || [];
    this.stepIndex = 0;
    this.forecast = forecast;
    this.onComplete = onComplete;
    var atkHP = attacker.hp, defHP = defender.hp;
    for (var i = this.combatSteps.length - 1; i >= 0; i--) {
      var st = this.combatSteps[i];
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
    var dt = GameMap.getTerrain(defender.x, defender.y);
    this.terrainType = dt || 'plain';
    this.setPhase('intro');
  }

  setPhase(p) {
    this.phase = p; this.timer = 0; this.hitTriggered = false;
    var d = {intro:300,ready:500,atk1:700,def1:700,atk2:700,def2:700,result:1000,outro:400};
    this.phaseDuration = d[p] || 0;
  }

  nextPhase() {
    switch(this.phase) {
      case 'intro': this.setPhase('ready'); break;
      case 'ready':
        this.stepIndex < this.combatSteps.length ? this.beginStrike() : this.setPhase('result'); break;
      case 'atk1': case 'def1': case 'atk2': case 'def2':
        this.stepIndex < this.combatSteps.length ? this.beginStrike() : this.setPhase('result'); break;
      case 'result': this.setPhase('outro'); break;
      case 'outro': this.active = false; this.phase = 'idle'; if(this.onComplete) this.onComplete(); break;
    }
  }

  beginStrike() {
    var s = this.combatSteps[this.stepIndex];
    var a = s.actor === this.attacker;
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
    var t = Math.min(1, this.timer / this.phaseDuration);
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.shakeX = (Math.random()-0.5)*8; this.shakeY = (Math.random()-0.5)*6;
      if (this.shakeTimer <= 0) { this.shakeX=0; this.shakeY=0; }
    }
    var hs = dt * 0.06;
    if (this.attackerHP > this.attackerTargetHP)
      this.attackerHP = Math.max(this.attackerTargetHP, this.attackerHP - hs*this.attackerMaxHP);
    if (this.defenderHP > this.defenderTargetHP)
      this.defenderHP = Math.max(this.defenderTargetHP, this.defenderHP - hs*this.defenderMaxHP);
    for (var i = this.effects.length-1; i >= 0; i--) {
      this.effects[i].timer += dt;
      if (this.effects[i].timer >= this.effects[i].duration) this.effects.splice(i,1);
    }
    switch(this.phase) {
      case 'intro': this.fadeAlpha = 1-t; if(this.timer>=this.phaseDuration) this.nextPhase(); break;
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
    var s = this.combatSteps[this.stepIndex-1]; if(!s) return;
    var a = s.actor === this.attacker;
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
      this.effects.push({type:'crit',x:400,y:160,text:'必殺！',color:'#ffd700',duration:1000,timer:0});
      this.effects.push({type:'damage',x:tx,y:ty-30,text:String(s.damage),color:'#ffd700',duration:1000,timer:0});
      this.shakeTimer=300;
      if(typeof SFX!=='undefined')SFX.crit();
    } else {
      this.effects.push({type:'flash',x:0,y:0,text:'',color:'#ffffff',duration:150,timer:0});
      this.effects.push({type:'damage',x:tx,y:ty-20,text:String(s.damage),color:'#ff3333',duration:800,timer:0});
      this.shakeTimer=150;
      if(typeof SFX!=='undefined')SFX.hit();
    }
  }

  _eo(t){return 1-Math.pow(1-t,3);} _ei(t){return t*t*t;} isActive(){return this.active;}

  render(ctx, cw, ch) {
    if(!this.active) return;
    ctx.save(); ctx.translate(this.shakeX, this.shakeY);
    this._drawBg(ctx, this.terrainType, cw, ch);
    this._drawPlat(ctx, cw, ch);
    var gy=ch*0.62, ax=180+this.attackerSlide+this.attackerAnimOffset;
    var dx=cw-180+this.defenderSlide+this.defenderAnimOffset, sz=64;
    var atkS=(this.phase==='atk1'||this.phase==='atk2');
    var defS=(this.phase==='def1'||this.phase==='def2');
    if(!this.attackerDead||this.deathAlpha>0){
      ctx.save(); if(this.attackerDead){ctx.globalAlpha=this.deathAlpha;ctx.translate(0,this.deathFall);}
      this._drawUnit(ctx,this.attacker,ax-sz/2,gy-sz,sz,'right',atkS); ctx.restore();
    }
    if(!this.defenderDead||this.deathAlpha>0){
      ctx.save(); if(this.defenderDead){ctx.globalAlpha=this.deathAlpha;ctx.translate(0,this.deathFall);}
      this._drawUnit(ctx,this.defender,dx-sz/2,gy-sz,sz,'left',defS); ctx.restore();
    }
    if(this.panelAlpha>0){
      ctx.globalAlpha=this.panelAlpha;
      this._drawHP(ctx,this.attacker,this.attackerHP,20,ch-135,false,cw);
      this._drawHP(ctx,this.defender,this.defenderHP,cw-290,ch-135,true,cw);
      ctx.globalAlpha=1;
    }
    this._renderFx(ctx,cw,ch);
    if(this.fadeAlpha>0){ctx.fillStyle='rgba(0,0,0,'+this.fadeAlpha+')';ctx.fillRect(-10,-10,cw+20,ch+20);}
    ctx.restore();
  }

  _drawBg(ctx, ter, w, h) {
    var m={forest:[['0','#1a3a1a'],['0.4','#2a5a2a'],['0.7','#3a6a3a'],['1','#2a4a2a']],
      mountain:[['0','#4a4a5a'],['0.4','#6a6a7a'],['0.7','#8a7a6a'],['1','#5a4a3a']],
      wall:[['0','#1a1a3a'],['0.4','#2a2a5a'],['0.7','#3a3a6a'],['1','#2a2a4a']],
      gate:[['0','#1a1a3a'],['0.4','#2a2a5a'],['0.7','#3a3a6a'],['1','#2a2a4a']],
      village:[['0','#5a4a3a'],['0.4','#7a6a5a'],['0.7','#8a7a6a'],['1','#6a5a4a']],
      river:[['0','#2a5a8a'],['0.4','#3a7aaa'],['0.7','#4a8aba'],['1','#3a6a9a']]};
    var stops=m[ter]||[['0','#4a7aaa'],['0.35','#6a9aca'],['0.65','#5a8a5a'],['1','#4a7a4a']];
    var g=ctx.createLinearGradient(0,0,0,h);
    for(var s of stops) g.addColorStop(parseFloat(s[0]),s[1]);
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=0.3;
    if(ter==='forest'){
      for(var i=0;i<6;i++){var tx=i*140+30,ty=h*0.35+Math.sin(i*2.3)*40;
        ctx.fillStyle='#1a4a1a';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-30,ty+50);ctx.lineTo(tx+30,ty+50);ctx.fill();
        ctx.beginPath();ctx.moveTo(tx,ty-20);ctx.lineTo(tx-25,ty+25);ctx.lineTo(tx+25,ty+25);ctx.fill();}
    } else if(ter==='mountain'){
      ctx.fillStyle='#8a8a9a';ctx.beginPath();ctx.moveTo(0,h*0.5);ctx.lineTo(150,h*0.2);ctx.lineTo(300,h*0.45);
      ctx.lineTo(450,h*0.15);ctx.lineTo(600,h*0.4);ctx.lineTo(w,h*0.25);ctx.lineTo(w,h*0.5);ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  _drawPlat(ctx, w, h) {
    var gy=h*0.65;
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(0,gy,w,3);
    var g=ctx.createLinearGradient(0,gy,0,h);g.addColorStop(0,'rgba(0,0,0,0.2)');g.addColorStop(1,'rgba(0,0,0,0.5)');
    ctx.fillStyle=g;ctx.fillRect(0,gy,w,h-gy);
  }

  _drawUnit(ctx, unit, x, y, size, facing, striking) {
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
    var cls = getClassData(unit.classId), weps = cls.weapons||[];
    var wpn = unit.getEquippedWeapon();
    var wt = wpn ? wpn.type : (weps[0]||'sword');
    var mag = ['fire','thunder','wind','dark','light'].includes(wt);
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
    var pw=270, ph=110;
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
      ctx.fillStyle='#fa8';ctx.font='11px monospace';ctx.textAlign='left';
      ctx.fillText(wpn.name,px+12,py+70);
      var atk=wpn.atk+(wpn.magic?unit.mag:unit.str);
      ctx.fillStyle='#8f8';ctx.fillText('\u653b:'+atk,px+12,py+85);
    }
    ctx.fillStyle='#888';ctx.font='10px sans-serif';
    var durText=wpn?'\u8015:'+wpn.usesLeft+'/'+wpn.uses:'\u6c92\u6709\u6b66\u5668';
    ctx.fillText(durText,px+12,py+100);
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
      }
    }
    ctx.globalAlpha=1;
  }
}

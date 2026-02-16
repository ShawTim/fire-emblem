// sprites.js - SNES Fire Emblem style procedural pixel art (32x32)
var Sprites = {
  cache: {},
  TILE: 32,
  _frameCounter: 0,
  tick: function() { this._frameCounter++; },
  _idleBounce: function() { return (Math.floor(this._frameCounter / 8) % 2 === 0) ? 0 : -1; },
  _rng: function(seed, n) { return ((seed * 9301 + 49297 + n * 1234) % 233280) / 233280; },
  _seed: function(x, y) { return (x * 31 + y * 17) & 0xffff; },

  getTerrainColor: function(type) {
    return { plain:{base:"#5a8",dark:"#497",light:"#6b9"}, forest:{base:"#385",dark:"#274",light:"#496"},
      mountain:{base:"#887",dark:"#665",light:"#998"}, wall:{base:"#556",dark:"#445",light:"#667"},
      gate:{base:"#776",dark:"#554",light:"#887"}, river:{base:"#48c",dark:"#37a",light:"#5ad"},
      village:{base:"#a86",dark:"#875",light:"#b97"} }[type] || {base:"#5a8",dark:"#497",light:"#6b9"};
  },

  drawTerrain: function(ctx, type, x, y) {
    var s=this.TILE, seed=this._seed(x,y), self=this;
    var rng = function(n) { return self._rng(seed, n); };
    var R = function(rx,ry,rw,rh,rc) { ctx.fillStyle=rc; ctx.fillRect(rx,ry,rw,rh); };
    var P = function(px,py,pc) { ctx.fillStyle=pc; ctx.fillRect(px,py,1,1); };

    if(type==='plain'){
      R(x,y,s,s,'#5a8844');
      var gr=['#4e7a3a','#5a8844','#6b9950','#4a7035'];
      for(var py=0;py<s;py++)for(var px=0;px<s;px++){var ck=(px+py)%2,z=((py>>2)+(px>>3))%3;
        if(ck===0&&z===0)P(x+px,y+py,gr[0]);else if(ck===1&&z===1)P(x+px,y+py,gr[2]);else if(ck===0&&z===2)P(x+px,y+py,gr[3]);}
      for(var i=0;i<4+(seed%4);i++){var gx=x+Math.floor(rng(i)*28)+2,gy=y+Math.floor(rng(i+20)*20)+8;P(gx,gy,'#6ba855');P(gx,gy-1,'#7cc060');}
      if(rng(99)>0.82){var fx=x+8+(seed%14),fy=y+10+(seed%10);R(fx,fy,2,2,rng(88)>0.5?'#ffe060':'#ff80d0');}

    }else if(type==='forest'){
      R(x,y,s,s,'#3a7030');
      for(var py=0;py<s;py++)for(var px=0;px<s;px++){if((px+py)%3===0)P(x+px,y+py,'#2e6028');}
      R(x+2,y+22,28,8,'rgba(0,0,0,0.2)');R(x+8,y+18,4,10,'#5a4030');R(x+9,y+19,2,9,'#6b5040');R(x+20,y+20,3,8,'#5a4030');
      ctx.fillStyle='#1a5520';ctx.beginPath();ctx.arc(x+10,y+14,10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2a6830';ctx.beginPath();ctx.arc(x+21,y+16,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#3a7a40';ctx.beginPath();ctx.arc(x+10,y+11,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#50a058';ctx.beginPath();ctx.arc(x+8,y+9,3,0,Math.PI*2);ctx.fill();
      R(x+12,y+8,2,2,'#60b068');

    }else if(type==='mountain'){
      R(x,y,s,s,'#887766');
      ctx.fillStyle='#998877';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+30,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      ctx.fillStyle='#665544';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+2,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      ctx.fillStyle='#887766';ctx.beginPath();ctx.moveTo(x+24,y+6);ctx.lineTo(x+31,y+20);ctx.lineTo(x+18,y+20);ctx.fill();
      R(x+13,y+1,6,4,'#dde0e8');R(x+14,y+0,4,2,'#eef0f4');R(x+22,y+6,4,3,'#ccd0d8');
      R(x+8,y+16,3,1,'#554433');R(x+20,y+12,1,3,'#554433');R(x+17,y+2,1,8,'#bbaa99');

    }else if(type==='wall'){
      R(x,y,s,s,'#667078');
      for(var row=0;row<4;row++){var ry=y+row*8,off=(row%2)*8;
        for(var col=0;col<3;col++){var bx=x+off+col*16,bc=['#707880','#687078','#6a7480','#5e6870','#747c84'][((row*3+col*7+seed)%5)];
          R(bx,ry,15,7,bc);R(bx,ry,15,1,'#808890');R(bx,ry+6,15,1,'#505860');}
        R(x,ry+7,s,1,'#4a5058');}
      R(x,y,s,1,'#8890a0');

    }else if(type==='gate'){
      R(x,y,s,s,'#706858');R(x,y,7,s,'#808080');R(x+25,y,7,s,'#808080');
      R(x+2,y,2,s,'#909090');R(x+27,y,2,s,'#909090');
      ctx.fillStyle='#8a8070';ctx.beginPath();ctx.arc(x+16,y+8,9,Math.PI,0);ctx.fill();
      ctx.fillStyle='#504838';ctx.beginPath();ctx.arc(x+16,y+8,7,Math.PI,0);ctx.fill();
      R(x+8,y+8,16,24,'#6a4828');R(x+9,y+9,14,22,'#7a5838');
      R(x+15,y+8,2,24,'#5a3820');R(x+8,y+18,16,2,'#5a3820');
      R(x+8,y+12,3,2,'#a0a0a0');R(x+8,y+22,3,2,'#a0a0a0');R(x+21,y+18,2,3,'#c0b060');

    }else if(type==='river'){
      R(x,y,s,s,'#3070b8');
      for(var py=0;py<s;py++){var w=Math.sin((py+seed*0.3)*0.8)*0.3;if(w>0.1)R(x,y+py,s,1,'#4088cc');else if(w<-0.1)R(x,y+py,s,1,'#2860a0');}
      var wo=seed%8;R(x+wo,y+6,10,1,'#60a8e0');R(x+((wo+12)%24),y+14,8,1,'#60a8e0');
      R(x+wo+2,y+5,3,1,'#a0d0f0');R(x+((wo+14)%22),y+13,4,1,'#a0d0f0');

    }else if(type==='village'){
      R(x,y,s,s,'#5a8844');
      R(x+4,y+14,24,14,'#c8a878');R(x+5,y+15,22,12,'#d4b888');
      ctx.fillStyle='#a83830';ctx.beginPath();ctx.moveTo(x+16,y+4);ctx.lineTo(x+30,y+14);ctx.lineTo(x+2,y+14);ctx.fill();
      ctx.fillStyle='#902828';ctx.beginPath();ctx.moveTo(x+16,y+4);ctx.lineTo(x+2,y+14);ctx.lineTo(x+16,y+14);ctx.fill();
      R(x+12,y+20,6,8,'#5a3820');R(x+13,y+21,4,7,'#6a4828');P(x+16,y+24,'#c0b060');
      R(x+21,y+17,5,5,'#304050');R(x+22,y+18,3,3,'#f0d870');
      R(x+22,y+3,4,8,'#706060');R(x+21,y+3,6,1,'#807070');

    }else if(type==='throne'){
      R(x,y,s,s,'#483860');
      for(var py=0;py<s;py+=8)for(var px=0;px<s;px+=8)R(x+px,y+py,8,8,((px+py)/8%2)?'#3c2c50':'#504070');
      R(x+4,y+4,24,24,'#a02020');R(x+5,y+5,22,22,'#b83030');
      R(x+4,y+4,24,1,'#d0a030');R(x+4,y+27,24,1,'#d0a030');R(x+4,y+4,1,24,'#d0a030');R(x+27,y+4,1,24,'#d0a030');
      R(x+10,y+4,12,6,'#d0a030');R(x+11,y+5,10,4,'#e0b840');
      R(x+9,y+10,14,8,'#d0a030');R(x+10,y+11,12,6,'#b83030');
      R(x+14,y+5,4,2,'#ff3030');R(x+8,y+10,2,6,'#c09028');R(x+22,y+10,2,6,'#c09028');

    }else if(type==='pillar'){
      R(x,y,s,s,'#686878');
      for(var py=0;py<s;py+=8)for(var px=0;px<s;px+=8)R(x+px,y+py,8,8,((px+py)/8%2)?'#606070':'#707080');
      R(x+14,y+2,10,28,'rgba(0,0,0,0.12)');R(x+10,y+4,12,24,'#a0a0b0');R(x+11,y+4,10,24,'#b0b0c0');
      R(x+13,y+4,3,24,'#c8c8d8');R(x+14,y+5,1,22,'#d8d8e8');
      R(x+8,y+2,16,3,'#989898');R(x+8,y+27,16,3,'#989898');

    }else{R(x,y,s,s,'#5a8844');}
    ctx.strokeStyle='rgba(0,0,0,0.10)';ctx.strokeRect(x+0.5,y+0.5,s-1,s-1);
  },

  getUnitColors: function(faction) {
    if(faction==='player')return{body:'#3060a8',armor:'#284880',accent:'#70a0e0',skin:'#f0d0b0',cloth:'#4878c0'};
    if(faction==='enemy')return{body:'#a03030',armor:'#802020',accent:'#e07070',skin:'#f0d0b0',cloth:'#c04848'};
    return{body:'#30a040',armor:'#208030',accent:'#70e080',skin:'#f0d0b0',cloth:'#48c058'};
  },

  _drawHead: function(ctx,hx,hy,hair,skin,eyes,w,h){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    R(hx+1,hy+3,w-2,h-3,skin);R(hx+2,hy+2,w-4,h-2,skin);R(hx+3,hy+1,w-6,h-1,skin);
    R(hx+2,hy,w-4,4,hair);R(hx+1,hy+1,w-2,3,hair);R(hx,hy+2,2,4,hair);R(hx+w-2,hy+2,2,4,hair);
    var ey=hy+Math.floor(h*0.5),el=hx+Math.floor(w*0.25),er=hx+Math.floor(w*0.65);
    R(el,ey,2,2,eyes);R(er,ey,2,2,eyes);
    ctx.fillStyle='#111';ctx.fillRect(el+1,ey+1,1,1);ctx.fillRect(er+1,ey+1,1,1);
    ctx.fillStyle='#c08878';ctx.fillRect(hx+Math.floor(w/2),hy+Math.floor(h*0.75),1,1);
  },

  _drawHP: function(ctx,unit,x,y){
    var s=this.TILE;if(unit.hp!==undefined&&unit.maxHp){var r=unit.hp/unit.maxHp;
    ctx.fillStyle='#300000';ctx.fillRect(x+4,y+s-2,24,2);
    ctx.fillStyle=r>0.5?'#40c040':r>0.25?'#c0c040':'#c04040';ctx.fillRect(x+4,y+s-2,Math.ceil(24*r),2);}
  },

  _drawCrown: function(ctx,x,y){
    ctx.fillStyle='#f0c000';ctx.fillRect(x+10,y,12,3);ctx.fillRect(x+10,y-1,1,1);ctx.fillRect(x+15,y-2,1,1);ctx.fillRect(x+21,y-1,1,1);
    ctx.fillStyle='#ff3030';ctx.fillRect(x+15,y,1,1);
  },

  drawUnit: function(ctx,unit,x,y,grayed){
    var c=this.getUnitColors(unit.faction);
    var hair=(unit.portrait&&unit.portrait.hair)?unit.portrait.hair:c.accent;
    var skin=(unit.portrait&&unit.portrait.skin)?unit.portrait.skin:c.skin;
    var eyes=(unit.portrait&&unit.portrait.eyes)?unit.portrait.eyes:'#222244';
    if(grayed)ctx.globalAlpha=0.5;
    var b=this._idleBounce(),by=y+b,cls=unit.classId||'soldier';
    switch(cls){
      case'lord':case'masterLord':this._drawLord(ctx,x,by,hair,skin,eyes,c);break;
      case'paladin':case'greatKnight':this._drawPaladin(ctx,x,by,hair,skin,eyes,c);break;
      case'cavalier':this._drawCavalier(ctx,x,by,hair,skin,eyes,c);break;
      case'archer':case'sniper':case'ranger':this._drawArcher(ctx,x,by,hair,skin,eyes,c);break;
      case'fighter':case'warrior':this._drawFighter(ctx,x,by,hair,skin,eyes,c);break;
      case'mercenary':case'swordmaster':case'hero':this._drawMercenary(ctx,x,by,hair,skin,eyes,c);break;
      case'mage':case'sage':case'darkMage':case'mageKnight':this._drawMage(ctx,x,by,hair,skin,eyes,c,cls);break;
      case'cleric':case'bishop':case'valkyrie':this._drawCleric(ctx,x,by,hair,skin,eyes,c);break;
      case'knight':case'general':this._drawKnight(ctx,x,by,hair,skin,eyes,c);break;
      case'thief':case'assassin':this._drawThief(ctx,x,by,hair,skin,eyes,c);break;
      case'wyvernRider':case'wyvernLord':this._drawWyvern(ctx,x,by,hair,skin,eyes,c);break;
      case'pegasusKnight':case'falconKnight':this._drawPegasus(ctx,x,by,hair,skin,eyes,c);break;
      case'brigand':this._drawBrigand(ctx,x,by,hair,skin,eyes,c);break;
      case'skeleton':this._drawSkeleton(ctx,x,by,hair,skin,eyes,c);break;
      default:this._drawSoldier(ctx,x,by,hair,skin,eyes,c);break;
    }
    if(unit.isBoss)this._drawCrown(ctx,x,by);
    if(grayed)ctx.globalAlpha=1.0;
    this._drawHP(ctx,unit,x,y);
  },

  _drawLord: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Cape flowing behind
    R(x+6,y+14,12,12,c.accent);R(x+4,y+18,6,8,'rgba(40,40,120,0.4)');
    // Body slim
    R(x+11,y+14,10,10,c.body);R(x+12,y+15,8,8,c.cloth);
    // Head
    this._drawHead(ctx,x+10,y+1,hair,skin,eyes,12,13);
    // Tiara
    R(x+12,y+1,8,2,'#e0c030');ctx.fillStyle='#f0d050';ctx.fillRect(x+16,y+0,1,1);
    // Legs
    R(x+12,y+24,3,5,c.armor);R(x+17,y+24,3,5,c.armor);
    // Rapier
    R(x+23,y+8,1,14,'#d0d0e0');R(x+22,y+14,3,1,'#c0b040');
    // Boots
    R(x+11,y+27,5,2,'#604020');R(x+16,y+27,5,2,'#604020');
  },

  _drawPaladin: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Horse body
    R(x+3,y+18,24,8,'#8B6040');R(x+4,y+19,22,6,'#9B7050');
    // Horse legs
    R(x+5,y+26,3,4,'#7B5030');R(x+11,y+26,3,4,'#7B5030');R(x+18,y+26,3,4,'#7B5030');R(x+23,y+26,3,4,'#7B5030');
    // Horse head
    R(x+1,y+14,6,7,'#8B6040');R(x+0,y+14,3,4,'#9B7050');ctx.fillStyle='#222';ctx.fillRect(x+1,y+15,1,1);
    // Heavy armor body
    R(x+10,y+10,12,9,c.armor);R(x+11,y+11,10,7,c.body);
    // Shoulder pauldrons
    R(x+8,y+10,4,4,c.armor);R(x+20,y+10,4,4,c.armor);
    // Head
    this._drawHead(ctx,x+10,y+0,hair,skin,eyes,12,11);
    // Helmet crest
    R(x+14,y-1,4,2,c.accent);
    // Lance
    R(x+25,y+0,2,20,'#b0b0b0');R(x+24,y+0,4,3,'#a0a0a0');
  },

  _drawCavalier: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Horse (smaller)
    R(x+5,y+19,20,7,'#9B7050');R(x+6,y+20,18,5,'#AB8060');
    R(x+7,y+26,3,4,'#8B6040');R(x+13,y+26,3,4,'#8B6040');R(x+19,y+26,3,4,'#8B6040');
    R(x+2,y+15,5,6,'#9B7050');ctx.fillStyle='#222';ctx.fillRect(x+3,y+16,1,1);
    // Rider body
    R(x+11,y+12,10,8,c.body);R(x+12,y+13,8,6,c.cloth);
    this._drawHead(ctx,x+11,y+1,hair,skin,eyes,11,11);
    // Lance
    R(x+23,y+4,2,16,'#b0b0b0');R(x+22,y+4,4,2,'#a0a0a0');
  },

  _drawArcher: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    R(x+10,y+14,10,10,c.body);R(x+11,y+15,8,8,c.cloth);
    this._drawHead(ctx,x+10,y+1,hair,skin,eyes,12,13);
    R(x+11,y+24,3,5,c.armor);R(x+16,y+24,3,5,c.armor);
    R(x+11,y+27,4,2,'#604020');R(x+16,y+27,4,2,'#604020');
    // Quiver on back
    R(x+7,y+12,3,10,'#8B6040');R(x+7,y+10,3,2,'#c0c0c0');
    // Bow
    ctx.strokeStyle='#a08040';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x+25,y+16,7,-1.2,1.2);ctx.stroke();ctx.lineWidth=1;
    // Arrow + arm
    R(x+18,y+15,8,1,'#c0c0c0');R(x+25,y+14,2,3,'#808080');R(x+19,y+14,4,2,skin);
  },

  _drawFighter: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Wide body
    R(x+7,y+14,18,11,c.body);R(x+8,y+15,16,9,c.cloth);
    // Broad shoulders
    R(x+5,y+14,4,5,c.body);R(x+23,y+14,4,5,c.body);
    this._drawHead(ctx,x+10,y+1,hair,skin,eyes,12,13);
    R(x+10,y+25,4,4,c.armor);R(x+17,y+25,4,4,c.armor);
    R(x+9,y+27,6,2,'#604020');R(x+16,y+27,6,2,'#604020');
    // Axe over shoulder
    R(x+24,y+4,2,16,'#8B6040');R(x+22,y+2,6,5,'#a0a0a0');R(x+23,y+3,4,3,'#c0c0c0');
  },

  _drawMercenary: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    R(x+10,y+14,12,10,c.body);R(x+11,y+15,10,8,c.cloth);
    this._drawHead(ctx,x+10,y+1,hair,skin,eyes,12,13);
    // Scarf/bandana
    R(x+6,y+6,4,6,'#e04040');R(x+5,y+8,3,8,'#c03030');
    R(x+12,y+24,3,5,c.armor);R(x+17,y+24,3,5,c.armor);
    R(x+11,y+27,5,2,'#604020');R(x+16,y+27,5,2,'#604020');
    // Sword at side
    R(x+23,y+10,1,14,'#d0d0e0');R(x+22,y+16,3,1,'#c0b040');R(x+22,y+10,3,2,'#c0b040');
  },

  _drawMage: function(ctx,x,y,hair,skin,eyes,c,cls){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    var robeCol=cls==='darkMage'?'#402050':c.body;
    var hatCol=cls==='darkMage'?'#302040':c.armor;
    // Robes (wide)
    R(x+8,y+14,16,12,robeCol);R(x+6,y+18,20,8,robeCol);R(x+9,y+15,14,10,robeCol);
    this._drawHead(ctx,x+10,y+3,hair,skin,eyes,12,12);
    // Pointed hat
    ctx.fillStyle=hatCol;ctx.beginPath();ctx.moveTo(x+16,y-2);ctx.lineTo(x+22,y+5);ctx.lineTo(x+10,y+5);ctx.fill();
    R(x+9,y+4,14,2,hatCol);
    R(x+8,y+26,16,3,robeCol);
    // Orb
    var orbCol=cls==='darkMage'?'#8030a0':'#40a0f0';
    ctx.fillStyle=orbCol;ctx.beginPath();ctx.arc(x+24,y+18,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x+23,y+17,1,0,Math.PI*2);ctx.fill();
  },

  _drawCleric: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // White robes
    R(x+9,y+14,14,12,'#e0d8c8');R(x+7,y+18,18,8,'#e0d8c8');R(x+10,y+15,12,10,'#f0e8d8');
    this._drawHead(ctx,x+10,y+1,hair,skin,eyes,12,13);
    R(x+9,y+1,14,3,'#e0d8c8');
    R(x+9,y+26,14,3,'#e0d8c8');
    // Staff with glow
    R(x+24,y+2,2,24,'#c0a040');R(x+23,y+0,4,3,'#f0e060');
    ctx.fillStyle='rgba(255,255,200,0.4)';ctx.beginPath();ctx.arc(x+25,y+1,4,0,Math.PI*2);ctx.fill();
  },

  _drawKnight: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Very wide armored body
    R(x+4,y+10,24,14,c.armor);R(x+5,y+11,22,12,c.body);
    // Huge pauldrons
    R(x+2,y+10,4,6,c.armor);R(x+26,y+10,4,6,c.armor);
    this._drawHead(ctx,x+10,y+0,hair,skin,eyes,12,11);
    // Helmet visor
    R(x+10,y+5,12,2,c.armor);
    // Shield (left side)
    R(x+0,y+12,6,10,c.accent);R(x+1,y+13,4,8,c.body);
    ctx.fillStyle='#e0c030';ctx.fillRect(x+2,y+15,2,4);
    // Thick legs
    R(x+8,y+24,6,5,c.armor);R(x+18,y+24,6,5,c.armor);
    R(x+7,y+27,8,2,'#505050');R(x+17,y+27,8,2,'#505050');
  },

  _drawThief: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Crouching body (lower)
    R(x+10,y+16,12,8,c.body);R(x+11,y+17,10,6,c.cloth);
    // Hood
    R(x+9,y+3,14,6,c.armor);R(x+8,y+5,3,4,c.armor);
    this._drawHead(ctx,x+10,y+4,hair,skin,eyes,12,12);
    // Cloak drape
    R(x+7,y+10,4,12,c.armor);
    // Crouching legs (bent)
    R(x+12,y+24,3,4,c.armor);R(x+17,y+24,3,4,c.armor);
    R(x+11,y+26,5,2,'#404040');R(x+16,y+26,5,2,'#404040');
    // Dagger
    R(x+23,y+16,1,8,'#c0c0d0');R(x+22,y+18,3,1,'#c0b040');
  },

  _drawWyvern: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Dragon body
    R(x+4,y+18,22,8,'#406050');R(x+5,y+19,20,6,'#507060');
    // Dragon head
    R(x+0,y+16,6,5,'#406050');R(x+0,y+17,3,3,'#507060');ctx.fillStyle='#ff3030';ctx.fillRect(x+1,y+17,1,1);
    // Dragon tail
    R(x+25,y+20,5,3,'#406050');R(x+28,y+21,3,2,'#507060');
    // Wings spread
    ctx.fillStyle='#508060';ctx.beginPath();ctx.moveTo(x+8,y+18);ctx.lineTo(x+0,y+6);ctx.lineTo(x+12,y+14);ctx.fill();
    ctx.fillStyle='#508060';ctx.beginPath();ctx.moveTo(x+20,y+18);ctx.lineTo(x+30,y+6);ctx.lineTo(x+18,y+14);ctx.fill();
    // Wing membrane
    ctx.fillStyle='#60a078';ctx.beginPath();ctx.moveTo(x+8,y+18);ctx.lineTo(x+2,y+8);ctx.lineTo(x+11,y+15);ctx.fill();
    // Dragon legs
    R(x+6,y+26,3,4,'#406050');R(x+20,y+26,3,4,'#406050');
    // Rider body
    R(x+11,y+11,10,8,c.armor);R(x+12,y+12,8,6,c.body);
    this._drawHead(ctx,x+10,y+0,hair,skin,eyes,12,11);
    // Lance
    R(x+23,y+2,2,16,'#b0b0b0');R(x+22,y+2,4,3,'#a0a0a0');
  },

  _drawPegasus: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Pegasus body
    R(x+5,y+19,20,7,'#e0d8d0');R(x+6,y+20,18,5,'#f0e8e0');
    // Pegasus head
    R(x+1,y+15,6,6,'#e0d8d0');ctx.fillStyle='#222';ctx.fillRect(x+2,y+16,1,1);
    // Pegasus legs
    R(x+7,y+26,3,4,'#d0c8c0');R(x+13,y+26,3,4,'#d0c8c0');R(x+19,y+26,3,4,'#d0c8c0');
    // White wings
    ctx.fillStyle='#f0f0ff';ctx.beginPath();ctx.moveTo(x+10,y+19);ctx.lineTo(x+2,y+6);ctx.lineTo(x+14,y+15);ctx.fill();
    ctx.fillStyle='#f0f0ff';ctx.beginPath();ctx.moveTo(x+20,y+19);ctx.lineTo(x+30,y+6);ctx.lineTo(x+18,y+15);ctx.fill();
    // Wing feather detail
    ctx.fillStyle='#e0e0f0';ctx.beginPath();ctx.moveTo(x+10,y+19);ctx.lineTo(x+4,y+9);ctx.lineTo(x+13,y+16);ctx.fill();
    // Rider body
    R(x+11,y+12,10,8,c.body);R(x+12,y+13,8,6,c.cloth);
    this._drawHead(ctx,x+11,y+1,hair,skin,eyes,11,11);
    // Lance
    R(x+23,y+4,2,16,'#b0b0b0');R(x+22,y+4,4,2,'#a0a0a0');
  },

  _drawBrigand: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Muscular body
    R(x+7,y+14,18,11,c.body);R(x+8,y+15,16,9,'#806040');
    // Bare arms
    R(x+4,y+14,5,6,skin);R(x+23,y+14,5,6,skin);
    this._drawHead(ctx,x+10,y+1,hair,skin,eyes,12,13);
    // Bandana
    R(x+10,y+1,12,3,'#c03030');R(x+22,y+2,4,2,'#c03030');
    R(x+10,y+25,4,4,c.armor);R(x+17,y+25,4,4,c.armor);
    R(x+9,y+27,6,2,'#604020');R(x+16,y+27,6,2,'#604020');
    // Big axe
    R(x+25,y+4,2,18,'#705030');R(x+23,y+2,6,6,'#a0a0a0');R(x+24,y+3,4,4,'#c0c0c0');
  },

  _drawSkeleton: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    // Bone-colored body
    R(x+11,y+14,10,10,'#c8c0a8');R(x+12,y+15,8,8,'#b8b098');
    // Ribcage lines
    R(x+12,y+16,8,1,'#908880');R(x+12,y+18,8,1,'#908880');R(x+12,y+20,8,1,'#908880');
    // Skull head
    R(x+10,y+1,12,12,'#d8d0b8');R(x+11,y+2,10,10,'#e0d8c0');
    R(x+12,y+0,8,2,'#d8d0b8');
    // Eye sockets (glowing)
    R(x+12,y+5,3,3,'#201010');R(x+17,y+5,3,3,'#201010');
    ctx.fillStyle='#ff2020';ctx.fillRect(x+13,y+6,1,1);ctx.fillRect(x+18,y+6,1,1);
    // Jaw
    R(x+12,y+10,8,2,'#c8c0a8');R(x+13,y+11,6,1,'#b0a890');
    // Bone legs
    R(x+12,y+24,2,5,'#c8c0a8');R(x+18,y+24,2,5,'#c8c0a8');
    // Dark aura
    ctx.fillStyle='rgba(40,0,40,0.15)';ctx.fillRect(x+8,y+12,16,16);
  },

  _drawSoldier: function(ctx,x,y,hair,skin,eyes,c){
    var R=function(a,b,c,d,e){ctx.fillStyle=e;ctx.fillRect(a,b,c,d);};
    R(x+10,y+14,12,10,c.body);R(x+11,y+15,10,8,c.cloth);
    this._drawHead(ctx,x+10,y+2,hair,skin,eyes,12,12);
    // Simple helmet
    R(x+10,y+1,12,3,c.armor);R(x+14,y+0,4,2,c.armor);
    R(x+12,y+24,3,5,c.armor);R(x+17,y+24,3,5,c.armor);
    R(x+11,y+27,5,2,'#604020');R(x+16,y+27,5,2,'#604020');
    // Lance upright
    R(x+24,y+2,2,22,'#b0b0b0');R(x+23,y+2,4,3,'#a0a0a0');
  },

  _portraitCache: {},
  _portraitCallbacks: [],
  _mapIconCache: {},

  preloadPortraits: function() {
    var chars = Object.keys(CHARACTERS);
    for (var i = 0; i < chars.length; i++) {
      var id = chars[i];
      if (!this._portraitCache[id]) {
        var img = new Image();
        img.src = 'portraits/' + id + '.png';
        this._portraitCache[id] = { img: img, loaded: false, failed: false };
        (function(cache, pid) {
          cache[pid].img.onload = function() { cache[pid].loaded = true; };
          cache[pid].img.onerror = function() { cache[pid].failed = true; };
        })(this._portraitCache, id);
      }
      if (!this._mapIconCache[id]) {
        var mimg = new Image();
        mimg.src = 'portraits/' + id + '_map.png';
        this._mapIconCache[id] = { img: mimg, loaded: false };
        (function(cache, pid) {
          cache[pid].img.onload = function() { cache[pid].loaded = true; };
          cache[pid].img.onerror = function() { cache[pid].loaded = false; };
        })(this._mapIconCache, id);
      }
    }
  },

  onPortraitReady: function(cb) { this._portraitCallbacks.push(cb); },

  drawGenericPortrait: function(ctx, unit, w, h) {
    var cls = getClassData(unit.classId);
    var colors = this.getUnitColors(unit.faction);
    var seed = (unit.classId || "").length * 31 + (unit.level || 1) * 7;
    ctx.fillStyle = unit.faction === 'enemy' ? '#2a1018' : '#182a10';
    ctx.fillRect(0, 0, w, h);
    var skinTones = ['#dba','#ecb','#fdb','#ca9','#eda'];
    ctx.fillStyle = skinTones[seed % skinTones.length];
    ctx.fillRect(w*0.25, h*0.2, w*0.5, h*0.55);
    var hairColors = ['#444','#654','#543','#765','#333','#876'];
    ctx.fillStyle = hairColors[seed % hairColors.length];
    if (cls.tags && cls.tags.includes('armored')) {
      ctx.fillStyle = '#888'; ctx.fillRect(w*0.2, h*0.05, w*0.6, h*0.3);
      ctx.fillStyle = '#777'; ctx.fillRect(w*0.25, h*0.35, w*0.5, h*0.08);
    } else if (cls.weapons && cls.weapons.includes('staff')) {
      ctx.fillStyle = '#ddc'; ctx.fillRect(w*0.15, h*0.05, w*0.7, h*0.25);
      ctx.fillRect(w*0.1, h*0.15, w*0.2, h*0.3); ctx.fillRect(w*0.7, h*0.15, w*0.2, h*0.3);
    } else {
      ctx.fillRect(w*0.2, h*0.05, w*0.6, h*0.2);
      ctx.fillRect(w*0.15, h*0.1, w*0.15, h*0.25); ctx.fillRect(w*0.7, h*0.1, w*0.15, h*0.25);
    }
    ctx.fillStyle = '#222';
    ctx.fillRect(w*0.32, h*0.42, w*0.1, h*0.08); ctx.fillRect(w*0.58, h*0.42, w*0.1, h*0.08);
    ctx.fillStyle = '#a86'; ctx.fillRect(w*0.38, h*0.6, w*0.24, h*0.05);
    ctx.fillStyle = colors.body; ctx.fillRect(w*0.1, h*0.75, w*0.8, h*0.25);
    ctx.fillStyle = colors.armor; ctx.fillRect(w*0.2, h*0.8, w*0.6, h*0.15);
    if (unit.isBoss) {
      ctx.fillStyle = '#fc0';
      ctx.fillRect(w*0.3, h*0.0, w*0.4, h*0.08);
      ctx.fillRect(w*0.3, h*0.0, w*0.08, h*0.12);
      ctx.fillRect(w*0.46, h*0.0, w*0.08, h*0.12);
      ctx.fillRect(w*0.62, h*0.0, w*0.08, h*0.12);
    }
  },

  drawPortrait: function(ctx, charId, w, h) {
    var ch = CHARACTERS[charId];
    if (!ch) { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, h); return; }
    if (!this._portraitCache[charId]) {
      var img = new Image();
      img.src = 'portraits/' + charId + '.png';
      this._portraitCache[charId] = { img: img, loaded: false, failed: false };
      img.onload = function() { Sprites._portraitCache[charId].loaded = true; };
      img.onerror = function() { Sprites._portraitCache[charId].failed = true; };
    }
    var cached = this._portraitCache[charId];
    if (cached.loaded) { ctx.drawImage(cached.img, 0, 0, w, h); return; }
    if (!ch.portrait) { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, h); return; }
    var p = ch.portrait;
    ctx.fillStyle = '#223'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = p.skin; ctx.fillRect(16, 20, 32, 36);
    ctx.fillStyle = p.hair; ctx.fillRect(12, 8, 40, 16);
    ctx.fillRect(12, 8, 8, 40); ctx.fillRect(44, 8, 8, 30);
    ctx.fillStyle = p.eyes; ctx.fillRect(22, 32, 6, 4); ctx.fillRect(36, 32, 6, 4);
    ctx.fillStyle = '#111'; ctx.fillRect(24, 33, 3, 2); ctx.fillRect(38, 33, 3, 2);
    ctx.fillStyle = '#c88'; ctx.fillRect(28, 44, 8, 2);
    ctx.fillStyle = '#da9'; ctx.fillRect(31, 38, 3, 4);
  },

  drawSeizeMarker: function(ctx, x, y, frame) {
    var s = this.TILE;
    var alpha = 0.4 + 0.3 * Math.sin(frame * 0.1);
    ctx.fillStyle = 'rgba(255,255,0,' + alpha + ')';
    ctx.fillRect(x+2, y+2, s-4, s-4);
    ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, s-2, s-2); ctx.lineWidth = 1;
  },

};
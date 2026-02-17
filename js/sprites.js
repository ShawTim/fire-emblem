// sprites.js - SNES Fire Emblem style procedural pixel art (32x32)
var Sprites = {
  cache: {},
  TILE: 32,
  _frameCounter: 0,
  _portraitCache: {},
  _mapIconCache: {},
  tick: function() { this._frameCounter++; },
  _idleFrame: function() { return Math.floor(this._frameCounter / 12) % 3; },
  _rng: function(seed, n) { return ((seed * 9301 + 49297 + n * 1234) % 233280) / 233280; },
  _seed: function(x, y) { return (x * 31 + y * 17) & 0xffff; },

  getTerrainColor: function(type) {
    return { plain:{base:"#58b848",dark:"#48a838",light:"#68c858"}, forest:{base:"#40a838",dark:"#309828",light:"#50b848"},
      mountain:{base:"#a09880",dark:"#887868",light:"#b0a890"}, wall:{base:"#807870",dark:"#686060",light:"#989088"},
      gate:{base:"#908880",dark:"#706858",light:"#a8a098"}, river:{base:"#3888d0",dark:"#2870b8",light:"#50a0e0"},
      village:{base:"#e0c898",dark:"#c8a878",light:"#ecd8a8"}, throne:{base:"#d83838",dark:"#c82020",light:"#e0b030"},
      pillar:{base:"#b0b0c0",dark:"#a8a8b8",light:"#c0c0d0"} }[type] || {base:"#58b848",dark:"#48a838",light:"#68c858"};
  },

  drawTerrain: function(ctx, type, x, y) {
    var s=this.TILE, seed=this._seed(x,y), self=this;
    var rng = function(n) { return self._rng(seed, n); };
    var R = function(rx,ry,rw,rh,rc) { ctx.fillStyle=rc; ctx.fillRect(rx,ry,rw,rh); };
    var P = function(px,py,pc) { ctx.fillStyle=pc; ctx.fillRect(px,py,1,1); };

    if(type==='plain'){
      // GBA Blazing Blade style warm green grass
      R(x,y,s,s,'#58b848');
      var gr=['#48a838','#58b848','#68c858','#50b040','#60c050'];
      for(var py=0;py<s;py++)for(var px=0;px<s;px++){
        var ck=(px+py)%2,z=((py>>2)+(px>>3)+seed)%5;
        P(x+px,y+py,gr[z]);
      }
      // Subtle grass tufts
      for(var i=0;i<3+(seed%3);i++){
        var gx=x+Math.floor(rng(i)*26)+3,gy=y+Math.floor(rng(i+20)*22)+5;
        P(gx,gy,'#78d868');P(gx+1,gy-1,'#88e878');P(gx-1,gy-1,'#70d060');
      }
      // Occasional flowers
      if(rng(99)>0.75){var fx=x+6+(seed%18),fy=y+8+(seed%14);
        var fc=rng(88)>0.5?'#ffe860':'#ff90d0';
        P(fx,fy,fc);P(fx+1,fy,fc);P(fx,fy+1,fc);P(fx+1,fy+1,fc);
        P(fx,fy-1,'#50b040');P(fx+2,fy,'#50b040');}

    }else if(type==='forest'){
      // Rich GBA forest with visible tree shapes
      R(x,y,s,s,'#48a040'); // bright grass base
      for(var py=0;py<s;py++)for(var px=0;px<s;px++){
        if((px+py+seed)%3===0)P(x+px,y+py,'#40983a');
      }
      // Shadow on ground
      R(x+2,y+22,28,8,'rgba(0,40,0,0.3)');
      // Tree trunks
      R(x+9,y+18,4,12,'#7a5030');R(x+10,y+19,2,10,'#8a6040');
      R(x+21,y+20,3,10,'#7a5030');R(x+22,y+21,1,8,'#8a6040');
      // Canopy layers (bright green with highlights)
      ctx.fillStyle='#208818';ctx.beginPath();ctx.arc(x+11,y+14,11,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#309828';ctx.beginPath();ctx.arc(x+22,y+16,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#40a838';ctx.beginPath();ctx.arc(x+11,y+11,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#50b848';ctx.beginPath();ctx.arc(x+9,y+9,4,0,Math.PI*2);ctx.fill();
      // Light dapples
      P(x+13,y+8,'#68d058');P(x+7,y+10,'#60c850');P(x+20,y+13,'#58c048');

    }else if(type==='mountain'){
      // Rocky gray-brown with visible peaks and snow
      R(x,y,s,s,'#a09880');
      // Main peak
      ctx.fillStyle='#b0a890';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+30,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      ctx.fillStyle='#887868';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+2,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      // Secondary peak
      ctx.fillStyle='#a09078';ctx.beginPath();ctx.moveTo(x+24,y+6);ctx.lineTo(x+31,y+20);ctx.lineTo(x+18,y+20);ctx.fill();
      ctx.fillStyle='#908068';ctx.beginPath();ctx.moveTo(x+24,y+6);ctx.lineTo(x+18,y+20);ctx.lineTo(x+22,y+20);ctx.fill();
      // Snow caps
      R(x+13,y+1,6,4,'#e8ecf4');R(x+14,y+0,4,2,'#f0f4f8');R(x+22,y+6,4,3,'#dce0e8');
      // Rock details
      R(x+8,y+16,3,1,'#706048');R(x+20,y+12,2,2,'#706048');R(x+17,y+2,1,8,'#b8a888');
      // Base grass
      R(x,y+26,s,6,'#58a848');R(x,y+24,s,3,'#80a870');

    }else if(type==='wall'){
      // Stone bricks with clear mortar lines
      R(x,y,s,s,'#807870');
      for(var row=0;row<4;row++){var ry=y+row*8,off=(row%2)*8;
        for(var col=0;col<3;col++){var bx=x+off+col*16;
          var bc=['#908880','#888078','#8c8480','#847c70','#989088'][((row*3+col*7+seed)%5)];
          R(bx,ry,15,7,bc);
          R(bx,ry,15,1,'#a0988e');  // top highlight
          R(bx,ry+6,15,1,'#686060');  // bottom shadow
          R(bx+14,ry,1,7,'#686060'); // right shadow
        }
        R(x,ry+7,s,1,'#585048');  // mortar line
      }
      // Top edge highlight
      R(x,y,s,1,'#b0a8a0');

    }else if(type==='gate'){
      // Archway with wooden door
      R(x,y,s,s,'#908880'); // stone base
      R(x,y,8,s,'#a09890');R(x+24,y,8,s,'#a09890'); // pillars
      R(x+2,y,3,s,'#b0a8a0');R(x+27,y,3,s,'#b0a8a0'); // pillar highlights
      // Arch
      ctx.fillStyle='#a8a098';ctx.beginPath();ctx.arc(x+16,y+8,10,Math.PI,0);ctx.fill();
      ctx.fillStyle='#685838';ctx.beginPath();ctx.arc(x+16,y+8,8,Math.PI,0);ctx.fill();
      // Wooden door
      R(x+8,y+8,16,24,'#8a6838');R(x+9,y+9,14,22,'#9a7848');
      R(x+15,y+8,2,24,'#705028');R(x+8,y+18,16,2,'#705028');
      // Iron studs and handle
      R(x+10,y+12,2,2,'#c0c0c0');R(x+10,y+22,2,2,'#c0c0c0');
      R(x+20,y+12,2,2,'#c0c0c0');R(x+20,y+22,2,2,'#c0c0c0');
      R(x+21,y+17,2,4,'#d0b060'); // door handle

    }else if(type==='river'){
      // Flowing blue water with wave highlights
      R(x,y,s,s,'#3888d0');
      for(var py=0;py<s;py++){
        var w=Math.sin((py+seed*0.3)*0.7)*0.4;
        if(w>0.15)R(x,y+py,s,1,'#50a0e0');
        else if(w<-0.15)R(x,y+py,s,1,'#2870b8');
      }
      // Wave crests
      var wo=seed%8;
      R(x+wo,y+6,12,1,'#70b8f0');R(x+((wo+14)%22),y+14,10,1,'#70b8f0');
      R(x+wo+3,y+5,4,1,'#a0d8ff');R(x+((wo+16)%20),y+13,5,1,'#a0d8ff');
      // Sparkle
      if(rng(77)>0.6){P(x+10+(seed%12),y+4+(seed%6),'#c0e8ff');}

    }else if(type==='village'){
      // Cute house with red roof on grass
      R(x,y,s,s,'#58b848'); // grass base
      for(var py=0;py<s;py++)for(var px=0;px<s;px++){
        if((px+py+seed)%4===0)P(x+px,y+py,'#50b040');
      }
      // House body
      R(x+4,y+14,24,14,'#e0c898');R(x+5,y+15,22,12,'#ecd8a8');
      // Roof (bright red)
      ctx.fillStyle='#d04030';ctx.beginPath();ctx.moveTo(x+16,y+3);ctx.lineTo(x+31,y+14);ctx.lineTo(x+1,y+14);ctx.fill();
      ctx.fillStyle='#b03028';ctx.beginPath();ctx.moveTo(x+16,y+3);ctx.lineTo(x+1,y+14);ctx.lineTo(x+16,y+14);ctx.fill();
      // Door
      R(x+12,y+20,6,8,'#7a5030');R(x+13,y+21,4,7,'#8a6040');P(x+16,y+24,'#d0b060');
      // Window with warm light
      R(x+21,y+17,5,5,'#405060');R(x+22,y+18,3,3,'#f8e070');
      // Chimney with smoke
      R(x+23,y+3,4,8,'#908070');R(x+22,y+3,6,1,'#a09080');
      P(x+24,y+1,'#c0c0c0');P(x+25,y+0,'#d0d0d0');

    }else if(type==='throne'){
      // Royal carpet + golden seat
      R(x,y,s,s,'#584070');
      // Checkered floor
      for(var py=0;py<s;py+=8)for(var px=0;px<s;px+=8)
        R(x+px,y+py,8,8,((px+py)/8%2)?'#4c3460':'#604880');
      // Royal red carpet
      R(x+4,y+4,24,24,'#c82020');R(x+5,y+5,22,22,'#d83838');
      // Gold border
      R(x+4,y+4,24,1,'#e0b030');R(x+4,y+27,24,1,'#e0b030');R(x+4,y+4,1,24,'#e0b030');R(x+27,y+4,1,24,'#e0b030');
      R(x+5,y+5,22,1,'#c89828');R(x+5,y+26,22,1,'#c89828');
      // Throne back
      R(x+10,y+4,12,6,'#e0b030');R(x+11,y+5,10,4,'#f0c840');
      // Seat
      R(x+9,y+10,14,8,'#e0b030');R(x+10,y+11,12,6,'#d83838');
      // Jewel and armrests
      R(x+14,y+5,4,2,'#ff4040');P(x+15,y+5,'#ff8080');
      R(x+8,y+10,2,7,'#d0a028');R(x+22,y+10,2,7,'#d0a028');

    }else if(type==='pillar'){
      // Stone column on checkered floor
      R(x,y,s,s,'#787888');
      for(var py=0;py<s;py+=8)for(var px=0;px<s;px+=8)
        R(x+px,y+py,8,8,((px+py)/8%2)?'#707080':'#808090');
      // Column shadow
      R(x+14,y+2,10,28,'rgba(0,0,0,0.15)');
      // Column body
      R(x+10,y+4,12,24,'#b0b0c0');R(x+11,y+4,10,24,'#c0c0d0');
      // Highlight stripe
      R(x+13,y+4,3,24,'#d0d0e0');R(x+14,y+5,1,22,'#e0e0f0');
      // Capital and base
      R(x+8,y+2,16,3,'#a8a8b8');R(x+9,y+2,14,1,'#c0c0d0');
      R(x+8,y+27,16,3,'#a8a8b8');R(x+9,y+29,14,1,'#989898');

    }else{R(x,y,s,s,'#58b848');}
    ctx.strokeStyle='rgba(0,0,0,0.08)';ctx.strokeRect(x+0.5,y+0.5,s-1,s-1);
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
    var eyes=(unit.portrait&&unit.portrait.eyes)?unit.portrait.eyes:'#222';
    if(grayed)ctx.globalAlpha=0.5;
    var frame=this._idleFrame(),by=y,cls=unit.classId||'soldier';

    // FE3-style: draw to offscreen, then render with thick black outline
    var os=document.createElement('canvas');os.width=48;os.height=48;
    var oc=os.getContext('2d');
    var ox=8,oy=8; // offset inside offscreen canvas
    var R=function(a,b,w,h,col){oc.fillStyle=col;oc.fillRect(a-x+ox,b-y+oy,w,h);};
    var P=function(a,b,col){oc.fillStyle=col;oc.fillRect(a-x+ox,b-y+oy,1,1);};

    // Eyes helper
    var dot=function(ex,ey){ P(ex,ey,'#111'); P(ex+4,ey,'#111'); };

    switch(cls){
      case'lord':case'masterLord':{
        R(x+11,by+1,2,1,hair);R(x+14,by+0,2,1,hair);
        R(x+9,by+2,8,1,hair);R(x+8,by+3,10,2,hair);
        R(x+7,by+4,3,3,hair);R(x+18,by+4,2,2,hair);
        R(x+9,by+5,9,4,skin);R(x+10,by+9,7,1,skin);
        dot(x+10,by+6);
        P(x+13,by+1,'#f0e040');P(x+14,by+1,'#f0e040');
        R(x+19,by+8,5,12,c.accent);R(x+22,by+13,3,6,c.accent);
        R(x+10,by+10,8,6,c.body);R(x+9,by+11,7,4,c.cloth);
        R(x+6,by+11,3,3,c.cloth);
        // Sword swing: 0=high, 1=mid, 2=low thrust
        var sw=[[3,6],[2,10],[1,14]][frame];
        R(x+sw[0],by+sw[1],1,8,'#c8d0e0');R(x+sw[0]-1,by+sw[1],3,1,'#e0d040');
        R(x+9,by+16,4,6,c.armor);R(x+15,by+17,3,5,c.armor);
        R(x+8,by+22,5,3,'#604020');R(x+14,by+22,4,3,'#604020');
        break;
      }
      case'paladin':case'greatKnight':{
        // Helmet (no hair visible)
        R(x+10,by+0,8,2,c.armor);R(x+9,by+2,10,3,c.armor);
        R(x+14,by-1,3,2,c.accent); // plume
        // Visor opening
        R(x+10,by+4,8,2,skin);
        dot(x+11,by+4);
        R(x+10,by+6,8,1,c.armor); // chin guard
        // Armored body
        R(x+10,by+7,9,5,c.armor);R(x+11,by+8,7,3,c.body);
        // Horse
        R(x+3,by+12,22,6,'#8B6040');R(x+5,by+13,18,4,'#9B7050');
        R(x-1,by+10,5,4,'#8B6040');P(x+0,by+11,'#222');
        R(x+24,by+14,3,3,'#6B4020');
        R(x+4,by+18,3,5,'#7B5030');R(x+11,by+19,3,4,'#7B5030');
        R(x+17,by+18,3,5,'#7B5030');R(x+22,by+19,3,4,'#7B5030');
        // Lance bob
        var lb=[0,-1,1][frame];
        R(x+20,by-1+lb,2,14,'#b0b0b0');R(x+19,by-1+lb,4,2,'#888');
        R(x+3,by+23,4,2,'#604020');R(x+10,by+23,4,2,'#604020');R(x+16,by+23,4,2,'#604020');R(x+21,by+23,4,2,'#604020');
        break;
      }
      case'cavalier':{
        // Hair top only
        R(x+10,by+2,8,2,hair);R(x+9,by+4,10,1,hair);
        R(x+9,by+5,9,3,skin); // face
        dot(x+10,by+5);
        R(x+10,by+8,7,1,skin); // chin
        // Body
        R(x+10,by+9,9,4,c.body);
        // Horse
        R(x+4,by+13,20,5,'#9B7050');
        R(x+1,by+11,4,4,'#9B7050');P(x+2,by+12,'#222');
        R(x+5,by+18,3,5,'#8B6040');R(x+12,by+19,3,4,'#8B6040');R(x+18,by+18,3,5,'#8B6040');
        var lb=[0,-1,1][frame];
        R(x+21,by+2+lb,2,12,'#b0b0b0');R(x+20,by+2+lb,4,2,'#999');
        R(x+4,by+23,4,2,'#604020');R(x+11,by+23,4,2,'#604020');R(x+17,by+23,4,2,'#604020');
        break;
      }
      case'archer':case'sniper':case'ranger':{
        // Ponytail — hair on top, ponytail extends RIGHT
        R(x+13,by+2,7,2,hair);R(x+12,by+4,8,1,hair);
        R(x+19,by+3,2,3,hair);R(x+20,by+5,2,3,hair); // ponytail
        // Face
        R(x+13,by+5,6,3,skin);
        dot(x+14,by+6);
        R(x+14,by+8,4,1,skin);
        // Body sideways
        R(x+13,by+9,7,7,c.body);
        // Bow draw animation
        var pullX=[0,2,4][frame];
        oc.strokeStyle='#a07030';oc.lineWidth=2;
        oc.beginPath();oc.arc(x-x+ox+7,by-y+oy+14,10,-1.0,1.0);oc.stroke();oc.lineWidth=1;
        R(x+6+pullX,by+13,14-pullX,1,'#c8c8c8');R(x+5+pullX,by+12,2,3,'#888');
        R(x+19+pullX,by+10,3,3,c.cloth);
        // Quiver
        R(x+20,by+7,3,8,'#8B6040');
        // Legs
        R(x+13,by+16,3,5,c.armor);R(x+17,by+17,3,4,c.armor);
        R(x+12,by+21,4,3,'#604020');R(x+16,by+21,4,3,'#604020');
        break;
      }
      case'fighter':case'warrior':{
        // Wild spiky hair — extends UP and OUT
        R(x+8,by+0,2,2,hair);R(x+11,by-1,3,2,hair);R(x+15,by+0,2,2,hair);R(x+18,by+1,2,1,hair);
        R(x+8,by+2,12,2,hair);
        // Face below (wide)
        R(x+8,by+4,11,4,skin);
        dot(x+9,by+5);
        R(x+10,by+8,6,1,skin);
        // Thick neck
        R(x+10,by+9,8,1,skin);
        // Wide body + bare arms
        R(x+6,by+10,16,7,c.body);R(x+4,by+10,3,4,skin);R(x+21,by+10,3,4,skin);
        // AXE swing: raised → mid → down
        var ax=[[22,1,19,-1],[20,4,17,2],[18,8,15,6]][frame];
        R(x+ax[0],by+ax[1],2,12,'#8B6040');
        R(x+ax[2],by+ax[3],8,4,'#a0a0a0');R(x+ax[2]+1,by+ax[3]+1,6,2,'#c0c0c0');
        // Wide legs
        R(x+7,by+17,5,4,c.armor);R(x+16,by+17,5,4,c.armor);
        R(x+6,by+21,6,3,'#604020');R(x+15,by+21,6,3,'#604020');
        break;
      }
      case'mercenary':case'swordmaster':case'hero':{
        // Messy hair top + bandana
        R(x+9,by+2,8,1,'#e04040'); // bandana
        R(x+8,by+0,9,2,hair);R(x+7,by+2,3,3,hair); // messy left
        R(x+17,by+1,2,2,hair); // messy right
        R(x+5,by+4,3,5,'#e04040'); // bandana tail
        // Face
        R(x+9,by+3,8,4,skin);
        dot(x+10,by+4);
        R(x+10,by+7,6,1,skin);
        // Body lunging
        R(x+9,by+8,9,7,c.body);
        // Sword arm right
        R(x+18,by+9,4,3,c.cloth);
        // Sword slash: high → mid → low
        var ss=[[22,3,23,2],[23,6,24,5],[24,10,25,9]][frame];
        R(x+ss[0],by+ss[1],1,9,'#d0d0e0');R(x+ss[2],by+ss[3],1,5,'#d0d0e0');
        R(x+ss[0]-1,by+ss[1]+5,3,2,'#c0a030');
        // Legs lunge
        R(x+8,by+15,4,4,c.armor);R(x+16,by+16,3,5,c.armor);
        R(x+7,by+19,5,4,'#604020');R(x+15,by+20,4,3,'#604020');
        break;
      }
      case'mage':case'sage':case'darkMage':case'mageKnight':{
        var hc=cls==='darkMage'?'#302040':c.armor;
        var rc=cls==='darkMage'?'#402050':c.body;
        // Pointy hat (big, extends up)
        oc.fillStyle=hc;oc.beginPath();
        oc.moveTo(x-x+ox+14,by-y+oy-2);oc.lineTo(x-x+ox+20,by-y+oy+5);oc.lineTo(x-x+ox+8,by-y+oy+5);oc.fill();
        R(x+7,by+5,14,2,hc); // brim
        // Hair peeking from under hat
        R(x+7,by+6,3,1,hair);R(x+18,by+6,3,1,hair);
        // Face
        R(x+9,by+6,8,3,skin);
        dot(x+10,by+7);
        R(x+10,by+9,6,1,skin);
        // Robe A-shape
        R(x+10,by+10,8,4,rc);R(x+8,by+14,12,4,rc);R(x+6,by+18,16,4,rc);
        // Casting arm + BIG orb
        R(x+22,by+12,3,3,rc);
        var orbC=cls==='darkMage'?'#a040d0':'#50c0ff';
        var orbR=[3,4,5][frame];
        oc.fillStyle=orbC;oc.beginPath();oc.arc(x-x+ox+26,by-y+oy+11,orbR,0,Math.PI*2);oc.fill();
        if(frame>0){P(x+25,by+10,'#fff');P(x+26,by+10,'#fff');}
        if(frame===2){P(x+24,by+9,'#fff');}
        // Feet
        R(x+8,by+22,4,2,rc);R(x+16,by+22,4,2,rc);
        break;
      }
      case'cleric':case'bishop':case'valkyrie':{
        // Long hair — extends DOWN past shoulders on sides
        R(x+10,by+2,8,2,hair);R(x+9,by+4,10,1,hair);
        R(x+7,by+5,2,8,hair);R(x+19,by+5,2,8,hair); // long side hair
        // Face
        R(x+9,by+5,9,3,skin);
        dot(x+10,by+6);
        R(x+10,by+8,7,1,skin);
        // White robe
        R(x+9,by+9,10,4,'#f0e8d8');R(x+8,by+13,12,5,'#e8e0d0');R(x+7,by+18,14,4,'#f0e8d8');
        // BIG staff with glow
        R(x+22,by+0,2,22,'#c0a040');R(x+21,by-1,4,2,'#f0e060');
        var glowR=[4,5,6][frame];var glowA=[0.3,0.5,0.7][frame];
        oc.fillStyle='rgba(255,255,180,'+glowA+')';oc.beginPath();oc.arc(x-x+ox+23,by-y+oy-1,glowR,0,Math.PI*2);oc.fill();
        R(x+9,by+22,5,2,'#d0c8b0');R(x+15,by+22,5,2,'#d0c8b0');
        break;
      }
      case'knight':case'general':{
        // Full enclosed helmet
        R(x+8,by+1,12,3,c.armor);R(x+7,by+4,14,4,c.armor);
        // Visor slit = face
        R(x+9,by+5,10,2,skin);
        dot(x+10,by+5);
        R(x+7,by+8,14,1,c.armor);
        // MASSIVE armor
        R(x+4,by+9,22,9,c.armor);R(x+5,by+10,20,7,c.body);
        // Shield raise: low → mid → high
        var sh=[0,-1,-2][frame];
        R(x+0,by+9+sh,5,10,c.accent);R(x+1,by+10+sh,3,8,c.body);
        P(x+2,by+13+sh,'#e0c030');P(x+2,by+14+sh,'#e0c030');
        // Lance right
        R(x+25,by+1,2,16,'#b0b0b0');R(x+24,by+1,4,2,'#999');
        // Thick legs
        R(x+7,by+18,7,4,c.armor);R(x+17,by+18,7,4,c.armor);
        R(x+6,by+22,8,2,'#505050');R(x+16,by+22,8,2,'#505050');
        break;
      }
      case'thief':case'assassin':{
        // Hood on top only — face exposed below
        R(x+9,by+2,10,3,c.armor);R(x+8,by+4,12,1,c.armor);
        R(x+7,by+3,2,3,c.armor); // hood side
        R(x+20,by+3,2,3,c.armor);
        // Face exposed
        R(x+9,by+5,9,3,skin);
        dot(x+10,by+6);
        R(x+10,by+8,7,1,skin);
        // Slim crouching body
        R(x+10,by+9,8,5,c.body);
        R(x+8,by+10,3,5,c.armor); // cloak
        // Dagger stab: ready → thrust → retract
        var dk=[0,3,1][frame];
        R(x+18+dk,by+10,3,2,c.cloth);
        R(x+21+dk,by+8,1,6,'#d0d0e0');R(x+20+dk,by+8,3,1,'#a0a080');
        // Crouching legs
        R(x+9,by+14,4,5,c.armor);R(x+15,by+13,4,6,c.armor);
        R(x+8,by+19,5,2,'#404040');R(x+14,by+19,5,2,'#404040');
        break;
      }
      case'wyvernRider':case'wyvernLord':{
        // Helm + hair
        R(x+10,by-1,8,2,c.armor);R(x+9,by+1,10,2,hair);
        R(x+9,by+3,9,2,skin); // face
        dot(x+10,by+3);
        // Rider body
        R(x+10,by+5,9,5,c.armor);
        // Dragon body
        R(x+2,by+10,26,7,'#406050');R(x+4,by+11,22,5,'#507060');
        R(x-2,by+9,6,4,'#406050');P(x-1,by+10,'#f03030');
        R(x+27,by+12,4,3,'#3a5040');
        // Wing flap: up → mid → down
        var wy=[[-1,2,1],[2,5,4],[5,8,7]][frame];
        oc.fillStyle='#508060';
        oc.beginPath();oc.moveTo(x-x+ox+6,by-y+oy+10);oc.lineTo(x-x+ox-4,by-y+oy+wy[0]);oc.lineTo(x-x+ox+14,by-y+oy+7);oc.fill();
        oc.beginPath();oc.moveTo(x-x+ox+24,by-y+oy+10);oc.lineTo(x-x+ox+35,by-y+oy+wy[1]);oc.lineTo(x-x+ox+20,by-y+oy+7);oc.fill();
        // Dragon feet
        R(x+4,by+17,4,6,'#406050');R(x+22,by+17,4,6,'#406050');
        R(x+3,by+22,5,2,'#305040');R(x+21,by+22,5,2,'#305040');
        break;
      }
      case'pegasusKnight':case'falconKnight':{
        // Long flowing hair extending right
        R(x+11,by+0,7,2,hair);R(x+10,by+2,8,1,hair);
        R(x+18,by+1,3,4,hair);R(x+20,by+3,2,3,hair); // flowing right
        // Face
        R(x+10,by+3,7,3,skin);
        dot(x+11,by+4);
        R(x+11,by+6,5,1,skin);
        // Rider body
        R(x+10,by+7,8,4,c.body);
        // Pegasus (white)
        R(x+4,by+11,20,6,'#e8e0d8');R(x+5,by+12,16,4,'#f0e8e0');
        R(x+0,by+9,5,4,'#e8e0d8');P(x+1,by+10,'#222');
        // Wing flap: up → mid → down
        var pw=[[-1,1,0],[2,4,3],[5,7,6]][frame];
        oc.fillStyle='#f0f0ff';
        oc.beginPath();oc.moveTo(x-x+ox+8,by-y+oy+11);oc.lineTo(x-x+ox-1,by-y+oy+pw[0]);oc.lineTo(x-x+ox+14,by-y+oy+8);oc.fill();
        oc.beginPath();oc.moveTo(x-x+ox+22,by-y+oy+11);oc.lineTo(x-x+ox+33,by-y+oy+pw[1]);oc.lineTo(x-x+ox+19,by-y+oy+8);oc.fill();
        // Pegasus legs
        R(x+6,by+17,2,5,'#d8d0c8');R(x+12,by+18,2,4,'#d8d0c8');R(x+19,by+17,2,5,'#d8d0c8');
        R(x+22,by+2,2,10,'#b0b0b0');
        R(x+5,by+22,3,2,'#c0b8b0');R(x+11,by+22,3,2,'#c0b8b0');R(x+18,by+22,3,2,'#c0b8b0');
        break;
      }
      case'brigand':{
        // Bald head + bandana on top
        R(x+9,by+3,10,2,'#804020');
        R(x+8,by+5,12,4,skin); // bald head is skin-colored
        dot(x+9,by+6);
        R(x+10,by+9,6,1,skin);
        // Body
        R(x+7,by+10,14,7,c.body);R(x+5,by+10,3,4,skin);R(x+20,by+10,3,4,skin);
        // AXE swing
        var bx=[[21,1,18,-1],[19,4,16,2],[17,8,14,6]][frame];
        R(x+bx[0],by+bx[1],2,12,'#8B6040');
        R(x+bx[2],by+bx[3],8,4,'#a0a0a0');R(x+bx[2]+1,by+bx[3]+1,6,2,'#c0c0c0');
        // Wide legs
        R(x+8,by+17,5,4,c.armor);R(x+16,by+17,5,4,c.armor);
        R(x+7,by+21,6,3,'#604020');R(x+15,by+21,6,3,'#604020');
        break;
      }
      case'skeleton':{
        // Skull — round white, no hair
        R(x+10,by+2,8,3,'#e8e0c8');R(x+9,by+4,10,4,'#d8d0b8');
        // Dark eye sockets
        R(x+11,by+5,2,2,'#222');R(x+15,by+5,2,2,'#222');
        P(x+11,by+5,'#f03030');P(x+16,by+5,'#f03030');
        // Jaw (open, no skin below)
        R(x+11,by+8,6,1,'#c8c0a8');R(x+12,by+9,4,1,'#333');
        // Ribcage
        R(x+10,by+10,8,6,'#d0c8b0');
        P(x+11,by+11,'#888');P(x+16,by+11,'#888');
        P(x+11,by+13,'#888');P(x+16,by+13,'#888');
        // Bony legs
        R(x+11,by+16,2,7,'#c8c0a8');R(x+15,by+16,2,7,'#c8c0a8');
        var sk=[0,1,-1][frame];
        R(x+19+sk,by+7,1,10,'#808080');R(x+20+sk,by+6,1,5,'#808080');
        R(x+10,by+22,4,2,'#a09880');R(x+14,by+22,4,2,'#a09880');
        break;
      }
      default:{ // soldier
        // Simple helmet top
        R(x+10,by+2,8,3,c.armor);R(x+9,by+5,10,1,c.armor);
        // Face
        R(x+10,by+5,7,3,skin);
        dot(x+11,by+6);
        R(x+10,by+8,7,1,skin);
        // Body + shield
        R(x+10,by+9,8,7,c.body);
        R(x+7,by+10,4,6,c.accent);
        // Lance bob
        var sl=[0,-1,1][frame];
        R(x+20,by+1+sl,2,14,'#b0b0b0');R(x+19,by+1+sl,4,2,'#999');
        // Legs
        R(x+10,by+16,4,5,c.armor);R(x+16,by+17,3,4,c.armor);
        R(x+9,by+21,5,3,'#604020');R(x+15,by+21,4,3,'#604020');
        break;
      }
    }

    if(unit.isBoss){
      ctx.fillStyle='#fc0';
      R(x+10,by-2,12,2,'#fc0');P(x+10,by-3,'#fc0');P(x+14,by-3,'#fc0');P(x+18,by-3,'#fc0');P(x+21,by-3,'#fc0');
    }
    if(grayed)ctx.globalAlpha=1.0;

    // Build final sprite with outline in compositing canvas
    var fin=document.createElement('canvas');fin.width=48;fin.height=48;
    var fc=fin.getContext('2d');
    var os2=document.createElement('canvas');os2.width=48;os2.height=48;
    var oc2=os2.getContext('2d');
    oc2.drawImage(os,0,0);
    oc2.globalCompositeOperation='source-in';
    oc2.fillStyle='#000';oc2.fillRect(0,0,48,48);
    var dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1],[-2,0],[2,0],[0,-2],[0,2]];
    for(var di=0;di<dirs.length;di++){fc.drawImage(os2,dirs[di][0],dirs[di][1]);}
    fc.drawImage(os,0,0);
    // Save current transform, reset to identity, draw at pixel coords, restore
    var ct=ctx.getTransform();
    ctx.setTransform(1,0,0,1,0,0);
    // Calculate actual screen position: apply the saved transform to (x-ox, y-oy)
    var px=(x-ox)*ct.a+ct.e, py=(y-oy)*ct.d+ct.f;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(fin,Math.round(px),Math.round(py),Math.round(48*ct.a),Math.round(48*ct.d));
    ctx.setTransform(ct);

    // HP bar (drawn on ctx, positioned correctly for scaled context)
    if(unit.hp!==undefined&&unit.maxHp){
      var ratio=unit.hp/unit.maxHp;
      ctx.fillStyle='#000';ctx.fillRect(x+3,y+30,26,3);
      ctx.fillStyle=ratio>0.5?'#40c040':ratio>0.25?'#c0c040':'#c04040';
      ctx.fillRect(x+4,y+31,Math.floor(24*ratio),1);
    }
  },



  _portraitCallbacks: [],

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
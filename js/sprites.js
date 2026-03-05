// sprites.js - SNES Fire Emblem style procedural pixel art (32x32)
// 
// Rendering modes:
//   window.RENDER_MODE = 'sprite' (default) - Use PNG sprites from assets/sprites/map/
//   window.RENDER_MODE = 'procedural' - Use canvas-drawn pixel art units
//
// To toggle at runtime: window.RENDER_MODE = 'procedural'; // or 'sprite'

const Sprites = {
  cache: {},
  TILE: 32,
  _frameCounter: 0,
  _portraitCache: {},
  tick: function(frame = 1) { this._frameCounter += frame; },
  _idleFrame: function() { var seq=[0,1,2,1,0]; return seq[Math.floor(this._frameCounter / GAME_CONFIG.ANIMATION_SPEEDS.SLOW) % 5]; },
  _rng: function(seed, n) { return ((seed * 9301 + 49297 + n * 1234) % 233280) / 233280; },
  _seed: function(x, y) { return (x * 31 + y * 17) & 0xffff; },

  getTerrainColor: function(type) {
    return { plain:{base:"#58b848",dark:"#48a838",light:"#68c858"}, forest:{base:"#40a838",dark:"#309828",light:"#50b848"},
      mountain:{base:"#a09880",dark:"#887868",light:"#b0a890"}, fort:{base:"#8a9a8a",dark:"#6a7a6a",light:"#aabaaa"}, wall:{base:"#807870",dark:"#686060",light:"#989088"},
      gate:{base:"#908880",dark:"#706858",light:"#a8a098"}, river:{base:"#3888d0",dark:"#2870b8",light:"#50a0e0"},
      village:{base:"#e0c898",dark:"#c8a878",light:"#ecd8a8"}, throne:{base:"#d83838",dark:"#c82020",light:"#e0b030"},
      pillar:{base:"#b0b0c0",dark:"#a8a8b8",light:"#c0c0d0"},
      floor:{base:"#c8c0b0",dark:"#b0a898",light:"#dcd4c4"},
      sea:{base:"#2870b8",dark:"#1a5898",light:"#4090d0"},
      desert:{base:"#d0b070",dark:"#c0a060",light:"#e0c080"},
      bridge:{base:"#9a7850",dark:"#7a5830",light:"#b09870"},
      ruins:{base:"#808070",dark:"#606050",light:"#a0a090"},
      stairs:{base:"#b8b0a0",dark:"#988880",light:"#d0c8b8"},
      brazier:{base:"#c8c0b0",dark:"#b0a898",light:"#dcd4c4"},
      hill:{base:"#68c050",dark:"#50a838",light:"#88e068"},
      swamp:{base:"#3a5828",dark:"#2a4018",light:"#508038"},
      cliff:{base:"#686050",dark:"#484038",light:"#908878"},
      pass:{base:"#a09070",dark:"#808060",light:"#c0b090"},
      road:{base:"#c8b870",dark:"#a89850",light:"#e0d090"},
      basin:{base:"#48a038",dark:"#388028",light:"#68c058"} }[type] || {base:"#58b848",dark:"#48a838",light:"#68c858"};
  },

  drawTerrain: function(ctx, type, x, y) {
    var s=GAME_CONFIG.TILE_SIZE, seed=this._seed(x,y), self=this;
    const rng = function(n) { return self._rng(seed, n); };
    const R = function(rx,ry,rw,rh,rc) { ctx.fillStyle=rc; ctx.fillRect(rx,ry,rw,rh); };
    const P = function(px,py,pc) { ctx.fillStyle=pc; ctx.fillRect(px,py,1,1); };

    if(type==='plain'){
      // GBA grass with perspective depth
      R(x,y,s,s,'#58b848');
      var gr=['#48a838','#58b848','#68c858','#50b040','#60c050'];
      for(let py=0;py<s;py++)for(let px=0;px<s;px++){
        var z=((py>>2)+(px>>3)+seed)%5;
        P(x+px,y+py,gr[z]);
      }
      // Perspective: top darker (farther), bottom brighter (closer)
      for(let dy=0;dy<10;dy++) R(x,y+dy,s,1,'rgba(0,20,0,'+((10-dy)*0.012).toFixed(3)+')');
      R(x,y+26,s,4,'rgba(100,200,80,0.07)');
      // Grass tufts with extra blade height
      for(let i=0;i<3+(seed%3);i++){
        var gx=x+Math.floor(rng(i)*26)+3,gy=y+Math.floor(rng(i+20)*22)+5;
        P(gx,gy,'#78d868');P(gx+1,gy-1,'#88e878');P(gx-1,gy-1,'#70d060');P(gx,gy-2,'#60c858');
      }
      // Occasional flowers
      if(rng(99)>0.75){var fx=x+6+(seed%18),fy=y+8+(seed%14);
        var fc=rng(88)>0.5?'#ffe860':'#ff90d0';
        P(fx,fy,fc);P(fx+1,fy,fc);P(fx,fy+1,fc);P(fx+1,fy+1,fc);
        P(fx,fy-1,'#50b040');P(fx+2,fy,'#50b040');}

    }else if(type==='forest'){
      // Forest with depth — darker base shadow, richer canopy
      R(x,y,s,s,'#48a040');
      for(let py=0;py<s;py++)for(let px=0;px<s;px++){
        if((px+py+seed)%3===0)P(x+px,y+py,'#40983a');
      }
      // Deeper ground shadow
      R(x,y+18,s,14,'rgba(0,30,0,0.45)');
      R(x+4,y+16,24,6,'rgba(0,30,0,0.25)');
      // Tree trunks with shadow side
      R(x+9,y+18,4,12,'#7a5030');R(x+10,y+19,2,10,'#8a6040');R(x+9,y+18,1,12,'#5a3818');
      R(x+21,y+20,3,10,'#7a5030');R(x+22,y+21,1,8,'#8a6040');R(x+21,y+20,1,10,'#5a3818');
      // Canopy — extra dark base layer for depth
      ctx.fillStyle='#186010';ctx.beginPath();ctx.arc(x+11,y+15,12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#208818';ctx.beginPath();ctx.arc(x+11,y+14,11,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#309828';ctx.beginPath();ctx.arc(x+22,y+16,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#40a838';ctx.beginPath();ctx.arc(x+11,y+11,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#50b848';ctx.beginPath();ctx.arc(x+9,y+9,4,0,Math.PI*2);ctx.fill();
      // Top-lit canopy highlight
      ctx.fillStyle='rgba(120,220,90,0.25)';ctx.beginPath();ctx.arc(x+8,y+8,3,0,Math.PI*2);ctx.fill();
      // Light dapples
      P(x+13,y+8,'#68d058');P(x+7,y+10,'#60c850');P(x+20,y+13,'#58c048');P(x+15,y+11,'#70d860');

    }else if(type==='mountain'){
      // Rocky peaks — strong light/shadow face contrast
      R(x,y,s,s,'#908870');
      // Main peak: bright right face, deep shadow left
      ctx.fillStyle='#c0b898';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+31,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      ctx.fillStyle='#606050';ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+1,y+24);ctx.lineTo(x+16,y+24);ctx.fill();
      // Peak ridge highlight
      ctx.strokeStyle='#d0c8a8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+16,y+1);ctx.lineTo(x+31,y+24);ctx.stroke();
      // Secondary peak
      ctx.fillStyle='#b0a880';ctx.beginPath();ctx.moveTo(x+24,y+6);ctx.lineTo(x+31,y+20);ctx.lineTo(x+18,y+20);ctx.fill();
      ctx.fillStyle='#706858';ctx.beginPath();ctx.moveTo(x+24,y+6);ctx.lineTo(x+18,y+20);ctx.lineTo(x+22,y+20);ctx.fill();
      // Snow with blue shadow
      R(x+13,y+1,6,4,'#edf0f8');R(x+14,y+0,4,2,'#f4f8ff');R(x+15,y+2,3,2,'#c8d0e4');
      R(x+22,y+6,4,3,'#dce4f0');R(x+23,y+8,2,1,'#c0c8d8');
      // Rock texture
      R(x+8,y+16,3,1,'#706048');R(x+20,y+12,2,2,'#706048');
      R(x+4,y+20,2,2,'#585038');R(x+25,y+18,2,1,'#585038');
      R(x+17,y+2,1,6,'#d8d0a8'); // peak highlight streak
      // Base grass with shadow line
      R(x,y+26,s,6,'#58a848');R(x,y+24,s,3,'#78a860');
      R(x,y+27,s,1,'rgba(0,0,0,0.1)');

    }else if(type==='fort'){
      // GBA-style Fort - central keep with flag
      const stone='#7a8a7a', stoneLight='#9aabaa', stoneDark='#5a6a5a', roof='#8b4513';
      // Stone pavement base
      R(x,y,s,s,stone);
      // Outer wall ring (8px thick)
      R(x+4,y+4,24,24,stoneDark);
      R(x+6,y+6,20,20,stone);
      // Inner courtyard
      R(x+8,y+8,16,16,'#6a7a6a');
      // Central keep (square tower)
      R(x+10,y+10,12,12,stoneLight);
      R(x+12,y+12,8,8,'#5a6a5a');
      // Roof
      R(x+10,y+10,12,3,roof);
      // Flag
      R(x+15,y+4,1,6,'#8b4513');
      R(x+16,y+4,4,3,'#4a9eff');
      // Corner details
      R(x+4,y+4,4,4,stoneLight);
      R(x+24,y+4,4,4,stoneLight);
      R(x+4,y+24,4,4,stoneLight);
      R(x+24,y+24,4,4,stoneLight);

    }else if(type==='wall'){
      // 3D stone wall — strong depth shading per brick
      R(x,y,s,s,'#686058');
      for(let row=0;row<4;row++){var ry=y+row*8,off=(row%2)*8;
        for(let col=0;col<3;col++){var bx=x+off+col*16;
          var bc=['#908880','#888078','#8c8480','#847c70','#989088'][((row*3+col*7+seed)%5)];
          R(bx,ry,15,7,bc);
          R(bx,ry,15,2,'#b8b0a8');   // strong top bevel (lit)
          R(bx,ry+5,15,2,'#484038'); // strong bottom bevel (shadow)
          R(bx,ry,1,7,'#a8a098');    // left edge light
          R(bx+14,ry,1,7,'#484038'); // right edge deep shadow
        }
        R(x,ry+7,s,1,'#282818');  // deep mortar line
      }
      // Strong top-of-tile highlight (light source above)
      R(x,y,s,2,'#c8c0b8');
      // Bottom pooling shadow
      R(x,y+28,s,4,'rgba(0,0,0,0.22)');
      // Right edge ambient shadow
      R(x+30,y,2,s,'rgba(0,0,0,0.1)');

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
      for(let py=0;py<s;py++){
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
      for(let py=0;py<s;py++)for(let px=0;px<s;px++){
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
      for(let py=0;py<s;py+=8)for(let px=0;px<s;px+=8)
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
      for(let py=0;py<s;py+=8)for(let px=0;px<s;px+=8)
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

    }else if(type==='floor'){
      // Palace marble — recessed tile bevel for depth
      R(x,y,s,s,'#b8b0a0');
      for(let ty=0;ty<4;ty++) for(let tx=0;tx<4;tx++){
        const px2=x+tx*8,py2=y+ty*8,chk=(tx+ty)%2;
        R(px2,py2,8,8,chk?'#c0b8a8':'#d0c8b8');
        // Bevel: bright top-left, dark bottom-right (raised look)
        R(px2,py2,7,1,'#e2dace');   // top edge bright
        R(px2,py2,1,7,'#e2dace');   // left edge bright
        R(px2,py2+7,8,1,'#868076'); // bottom edge (grout shadow)
        R(px2+7,py2,1,8,'#868076'); // right edge (grout shadow)
      }
      // Corner sheen on light tiles
      for(let ty=0;ty<4;ty++) for(let tx=0;tx<4;tx++){
        if((tx+ty)%2===0){P(x+tx*8+1,y+ty*8+1,'#eee6d6');}
      }

    }else if(type==='brazier'){
      // 宮殿火炬台 — 石板地板 + 鐵製托架 + 火焰
      R(x,y,s,s,'#c8c0b0');
      for(let py=0;py<s;py+=8)for(let px=0;px<s;px+=8){
        R(x+px,y+py,8,8,((px+py)/8)%2?'#c0b8a8':'#d0c8b8');
      }
      for(let gy=8;gy<s;gy+=8)R(x,y+gy,s,1,'#a09888');
      for(let gx=8;gx<s;gx+=8)R(x+gx,y,1,s,'#a09888');
      // 地板光暈
      const grd=ctx.createRadialGradient(x+16,y+16,0,x+16,y+16,16);
      grd.addColorStop(0,'rgba(255,160,0,0.35)');grd.addColorStop(1,'rgba(255,160,0,0)');
      ctx.fillStyle=grd;ctx.fillRect(x,y,s,s);
      // 鐵製托架腳 + 底座
      R(x+14,y+22,4,8,'#504840');R(x+12,y+28,8,2,'#404030');
      // 鐵碗
      R(x+10,y+16,12,6,'#605040');R(x+11,y+15,10,2,'#706050');R(x+9,y+20,14,2,'#504030');
      // 火焰（由外到內）
      ctx.fillStyle='#c84000';ctx.beginPath();ctx.arc(x+16,y+12,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff6800';ctx.beginPath();ctx.arc(x+15,y+10,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(x+16,y+8,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffee80';ctx.beginPath();ctx.arc(x+16,y+7,1,0,Math.PI*2);ctx.fill();

    }else if(type==='sea'){
      // Deep ocean — banded waves + foam + depth
      R(x,y,s,s,'#1a5898');
      for(let dy=0;dy<s;dy+=4) R(x,y+dy,s,4,dy%8===0?'#2870b8':'#1a5898');
      const wo=seed%16;
      R(x+wo,y+5,10,1,'rgba(140,210,255,0.8)');R(x,y+5,wo,1,'rgba(140,210,255,0.8)');
      R(x+((wo+18)%24),y+16,8,1,'rgba(140,210,255,0.7)');
      R(x+((wo+8)%20),y+25,12,1,'rgba(140,210,255,0.6)');
      P(x+(wo+2)%30,y+6,'#c8e8ff');P(x+(wo+12)%28,y+6,'#d8f0ff');
      P(x+(wo+4)%26,y+17,'#c0e0ff');
      R(x,y+20,s,12,'rgba(0,20,60,0.18)'); // depth darkening
      R(x,y,14,5,'rgba(120,190,255,0.1)'); // sky reflection

    }else if(type==='desert'){
      // Sandy desert with dune ridges + pebbles
      R(x,y,s,s,'#c8a870');
      var sd=['#d4b478','#c0a068','#ccac72','#d8bc7c','#bca064'];
      for(let dy=0;dy<s;dy++) for(let dx=0;dx<s;dx++) P(x+dx,y+dy,sd[((dx>>2)+(dy>>3)+seed*3)%5]);
      // Dune crest
      const dh=12+Math.round(Math.sin(seed*0.8)*5);
      ctx.fillStyle='#dcc080';
      ctx.beginPath();ctx.moveTo(x,y+dh);
      for(let dx=0;dx<=s;dx++) ctx.lineTo(x+dx,y+dh+Math.round(Math.sin((dx+seed)*0.35)*4));
      ctx.lineTo(x+s,y+s);ctx.lineTo(x,y+s);ctx.fill();
      // Shadow under crest
      ctx.fillStyle='rgba(80,50,0,0.2)';
      ctx.beginPath();ctx.moveTo(x,y+dh+2);
      for(let dx=0;dx<=s;dx++) ctx.lineTo(x+dx,y+dh+2+Math.round(Math.sin((dx+seed)*0.35)*4));
      ctx.lineTo(x+s,y+dh+10);ctx.lineTo(x,y+dh+10);ctx.fill();
      // Pebbles
      if(rng(50)>0.55){const rx=x+6+(seed%18),ry=y+20+(seed%8);R(rx,ry,3,2,'#a88e58');R(rx+1,ry,2,1,'#c0a870');}
      if(rng(60)>0.65){R(x+18+(seed%10),y+10+(seed%6),2,2,'#a88e58');}

    }else if(type==='bridge'){
      // Wooden bridge — stone railings + planks + river sides
      R(x,y,s,s,'#2870b8'); // river
      const wo2=seed%8;
      R(x+wo2,y+8,10,1,'rgba(100,180,240,0.7)');
      R(x+((wo2+16)%22),y+22,8,1,'rgba(100,180,240,0.6)');
      // Stone railings with highlight/shadow
      R(x+1,y,5,s,'#9a8e70');R(x+3,y,2,s,'#b0a480');R(x+5,y,1,s,'rgba(0,0,0,0.2)');
      R(x+26,y,5,s,'#9a8e70');R(x+27,y,2,s,'#b0a480');R(x+30,y,1,s,'rgba(0,0,0,0.2)');
      // Wooden planks
      for(let py2=0;py2<s;py2+=4){
        const wc=(py2/4)%2===0?'#9a7850':'#886840';
        R(x+6,y+py2,20,3,wc);
        R(x+6,y+py2,20,1,'#b09868');   // top highlight
        R(x+6,y+py2+2,20,1,'#6a5030'); // bottom shadow
      }
      R(x+6,y,1,s,'#685028');R(x+25,y,1,s,'#685028'); // plank edge shadows

    }else if(type==='ruins'){
      // Overgrown stone ruins on grass
      R(x,y,s,s,'#508840');
      for(let py2=0;py2<s;py2++) for(let px2=0;px2<s;px2++){
        if((px2+py2+seed)%4===0) P(x+px2,y+py2,'#488038');
      }
      // Main slab with 3D faces
      ctx.fillStyle=['#8e8c7c','#7c7a6a','#969480','#6e6c5c'][seed%4];
      ctx.beginPath();ctx.moveTo(x+3,y+8);ctx.lineTo(x+20,y+6);ctx.lineTo(x+22,y+22);ctx.lineTo(x+5,y+24);ctx.fill();
      ctx.fillStyle='#b4b2a0'; // lit top face
      ctx.beginPath();ctx.moveTo(x+3,y+8);ctx.lineTo(x+20,y+6);ctx.lineTo(x+20,y+9);ctx.lineTo(x+4,y+11);ctx.fill();
      ctx.fillStyle='#5c5a4c'; // shadow right face
      ctx.beginPath();ctx.moveTo(x+20,y+6);ctx.lineTo(x+22,y+22);ctx.lineTo(x+21,y+22);ctx.lineTo(x+19,y+8);ctx.fill();
      // Cracks
      ctx.strokeStyle='#484838';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+7,y+12);ctx.lineTo(x+15,y+18);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+13,y+10);ctx.lineTo(x+10,y+20);ctx.stroke();
      // Rubble + moss
      R(x+22,y+11,4,3,'#808070');R(x+23,y+11,3,2,'#a0a090');
      R(x+3,y+24,3,3,'#707060');R(x+25,y+24,4,2,'#787868');
      P(x+12,y+14,'#40a040');P(x+18,y+20,'#38983a');P(x+7,y+18,'#48a842');

    }else if(type==='stairs'){
      // Stone steps — indoor palace (4 steps in perspective)
      R(x,y,s,s,'#b0a890');
      const stepFace=['#c8c0a8','#d0c8b0','#d8d0b8','#e0d8c0'];
      const stepSide=['#908870','#988878','#a09080','#a89888'];
      const stepShadow='#686050';
      for(let st=0;st<4;st++){
        const top=y+s-8*(st+1), left=x+st*2, w=s-st*4;
        R(left,top,w,2,stepFace[st]);         // top face (bright)
        R(left,top+2,w,5,stepSide[st]);       // front face
        R(left,top+2,1,5,stepShadow);         // left edge shadow
        R(left+w-1,top+2,1,5,stepShadow);     // right edge shadow
        R(left,top+6,w,1,'#504840');           // bottom edge
      }
      // Top step surface with slight marble texture
      R(x+8,y,s-16,6,'#e8e0d0');
      R(x+8,y,s-16,1,'#f0e8d8');

    }else if(type==='hill'){
      // Rolling hill — mound with lit top + cast shadow
      R(x,y,s,s,'#58b848');
      var grh=['#48a838','#58b848','#68c858','#50b040','#60c050'];
      for(let py=0;py<s;py++) for(let px=0;px<s;px++) P(x+px,y+py,grh[((py>>2)+(px>>3)+seed)%5]);
      // Hill shadow base
      ctx.fillStyle='rgba(0,30,0,0.28)';
      ctx.beginPath();ctx.arc(x+17,y+23,13,0,Math.PI*2);ctx.fill();
      // Hill body
      ctx.fillStyle='#68c050';
      ctx.beginPath();ctx.moveTo(x+4,y+28);ctx.quadraticCurveTo(x+16,y+6,x+28,y+28);ctx.fill();
      // Lit top face
      ctx.fillStyle='#88e068';
      ctx.beginPath();ctx.moveTo(x+10,y+22);ctx.quadraticCurveTo(x+16,y+8,x+22,y+22);ctx.fill();
      // Peak highlight
      P(x+16,y+10,'#a0f080');P(x+15,y+11,'#90e070');P(x+17,y+11,'#90e070');
      // Grass tufts on slope
      P(x+8,y+24,'#70c858');P(x+24,y+24,'#70c858');P(x+12,y+16,'#78d060');
      // Small rock
      R(x+20,y+22,3,2,'#909080');R(x+21,y+22,2,1,'#a8a898');
      // Perspective darkening at top
      for(let dy=0;dy<6;dy++) R(x,y+dy,s,1,'rgba(0,20,0,'+((6-dy)*0.012).toFixed(3)+')');

    }else if(type==='swamp'){
      // Murky swamp — dark water patches + lily pads + bubbles
      R(x,y,s,s,'#3a5828');
      var svp=['#384a20','#405830','#304020','#483820','#3a5028'];
      for(let py=0;py<s;py++) for(let px=0;px<s;px++) P(x+px,y+py,svp[((px>>2)+(py>>3)+seed)%5]);
      // Murky water pools
      ctx.fillStyle='rgba(20,40,10,0.65)';
      ctx.beginPath();ctx.arc(x+12,y+14,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(30,50,10,0.55)';
      ctx.beginPath();ctx.arc(x+22,y+21,6,0,Math.PI*2);ctx.fill();
      // Water sheen lines
      R(x+5,y+12,9,1,'rgba(70,110,30,0.5)');R(x+17,y+19,7,1,'rgba(70,110,30,0.4)');
      // Lily pads
      ctx.fillStyle='#4a8838';ctx.beginPath();ctx.arc(x+11,y+14,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#58a040';ctx.beginPath();ctx.arc(x+10,y+13,3,0,Math.PI*2);ctx.fill();
      P(x+10,y+11,'#d05050'); // tiny flower on lily pad
      ctx.fillStyle='#4a8838';ctx.beginPath();ctx.arc(x+22,y+21,3,0,Math.PI*2);ctx.fill();
      // Bubbles
      ctx.strokeStyle='rgba(100,170,60,0.6)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x+17,y+7,2,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(x+7,y+23,1,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(x+26,y+10,1,0,Math.PI*2);ctx.stroke();
      // Ground fog / murk
      R(x,y+26,s,6,'rgba(40,70,10,0.3)');

    }else if(type==='cliff'){
      // Impassable cliff face — vertical rock drop
      R(x,y,s,s,'#585048');
      // Top grass edge
      R(x,y,s,5,'#58a848');R(x,y+4,s,2,'rgba(0,0,0,0.25)');
      // Rock face
      R(x,y+6,s,22,'#706858');
      for(let crow=0;crow<3;crow++){
        const cry=y+6+crow*7,coff=(crow%2)*5;
        for(let ccol=0;ccol<4;ccol++){
          const cbx=x+coff+ccol*9;
          R(cbx,cry,8,6,['#786860','#686050','#706860','#787060'][((crow*4+ccol+seed)%4)]);
          R(cbx,cry,8,1,'#908880'); // top edge lit
          R(cbx,cry+5,8,1,'#484038'); // bottom edge dark
        }
      }
      // Main crack
      ctx.strokeStyle='#383028';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+16,y+7);ctx.lineTo(x+14,y+15);ctx.lineTo(x+17,y+23);ctx.stroke();
      // Debris at base
      R(x,y+28,s,4,'#484038');
      R(x+4,y+27,5,3,'#686050');R(x+14,y+28,4,2,'#606048');R(x+23,y+27,5,3,'#686050');
      R(x+5,y+27,3,2,'#787868');R(x+16,y+29,3,1,'#787868');

    }else if(type==='pass'){
      // Mountain pass — narrow gap between two rock faces
      R(x,y,s,s,'#a09070');
      // Gravel path (center)
      var grv=['#b0a880','#989070','#a89878','#c0b888'];
      for(let py=0;py<s;py++) for(let px=8;px<24;px++) P(x+px,y+py,grv[((px+py+seed)%4)]);
      // Left mountain face (shadow side)
      ctx.fillStyle='#505040';
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+10,y);ctx.lineTo(x+8,y+s);ctx.lineTo(x,y+s);ctx.fill();
      ctx.fillStyle='#403830';
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7,y);ctx.lineTo(x+5,y+s);ctx.lineTo(x,y+s);ctx.fill();
      // Right mountain face (lit side)
      ctx.fillStyle='#b0a888';
      ctx.beginPath();ctx.moveTo(x+s,y);ctx.lineTo(x+22,y);ctx.lineTo(x+24,y+s);ctx.lineTo(x+s,y+s);ctx.fill();
      ctx.fillStyle='#c8c0a0';
      ctx.beginPath();ctx.moveTo(x+s,y);ctx.lineTo(x+26,y);ctx.lineTo(x+28,y+s);ctx.lineTo(x+s,y+s);ctx.fill();
      // Snow on peak tops
      R(x,y,8,3,'#edf0f8');R(x+24,y,8,3,'#edf0f8');
      // Path shadow under overhanging rock
      R(x+8,y,3,s,'rgba(0,0,0,0.12)');R(x+21,y,3,s,'rgba(0,0,0,0.08)');
      // Small rocks on path
      R(x+10,y+8,2,2,'#888070');R(x+21,y+20,3,2,'#888070');
      R(x+11,y+8,1,2,'#a8a090');R(x+22,y+20,2,1,'#a8a090');

    }else if(type==='road'){
      // Dirt road — wheel ruts + gravel
      R(x,y,s,s,'#c8b870');
      var rdc=['#c0b068','#c8b870','#d0c078','#b8a860','#ccc078'];
      for(let py=0;py<s;py++) for(let px=0;px<s;px++) P(x+px,y+py,rdc[((py>>2)+(px>>3)+seed)%5]);
      // Wheel ruts (parallel grooves going vertically = N-S road)
      R(x+6,y,4,s,'#a89860');R(x+7,y,2,s,'#988850');
      R(x+22,y,4,s,'#a89860');R(x+23,y,2,s,'#988850');
      R(x+7,y,1,s,'rgba(0,0,0,0.12)');R(x+23,y,1,s,'rgba(0,0,0,0.12)');
      // Center strip (sparse grass)
      for(let py2=2;py2<s;py2+=7){
        if(rng(py2)>0.45){P(x+16,y+py2,'#70b858');P(x+15,y+py2+1,'#68a850');}
      }
      // Scattered pebbles
      if(rng(40)>0.55){R(x+10+(seed%8),y+12+(seed%8),2,1,'#a09080');}
      if(rng(41)>0.6){R(x+19+(seed%6),y+20+(seed%6),2,1,'#a09080');}
      // Perspective: top slightly darker
      for(let dy=0;dy<5;dy++) R(x,y+dy,s,1,'rgba(0,0,0,'+((5-dy)*0.01).toFixed(3)+')');

    }else if(type==='basin'){
      // Basin/valley — lush low ground + small puddle
      R(x,y,s,s,'#48a038');
      var bsn=['#408830','#489838','#40a030','#4aa040','#389030'];
      for(let py=0;py<s;py++) for(let px=0;px<s;px++) P(x+px,y+py,bsn[((py>>2)+(px>>3)+seed)%5]);
      // Elevation shadow: darker at top
      for(let dy=0;dy<8;dy++) R(x,y+dy,s,1,'rgba(0,30,0,'+((8-dy)*0.014).toFixed(3)+')');
      // Small puddle / pool
      ctx.fillStyle='#3878a8';
      ctx.beginPath();ctx.arc(x+16,y+18,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(120,190,255,0.4)';
      ctx.beginPath();ctx.arc(x+14,y+16,3,0,Math.PI*2);ctx.fill(); // sky reflection
      // Reeds / tall grass around pool
      R(x+9,y+14,1,5,'#60b848');R(x+10,y+13,1,3,'#70c858');
      R(x+23,y+15,1,5,'#60b848');R(x+22,y+14,1,3,'#70c858');
      R(x+16,y+12,1,4,'#58b040');
      // Moisture flowers
      P(x+12,y+22,'#ffe060');P(x+20,y+24,'#ff90d0');P(x+8,y+26,'#ffe060');

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
    var s=GAME_CONFIG.TILE_SIZE;if(unit.hp!==undefined&&unit.maxHp){var r=unit.hp/unit.maxHp;
    ctx.fillStyle='#300000';ctx.fillRect(x+4,y+s-2,24,2);
    ctx.fillStyle=r>0.5?'#40c040':r>0.25?'#c0c040':'#c04040';ctx.fillRect(x+4,y+s-2,Math.ceil(24*r),2);}
  },

  _drawCrown: function(ctx,x,y){
    ctx.fillStyle='#f0c000';ctx.fillRect(x+10,y,12,3);ctx.fillRect(x+10,y-1,1,1);ctx.fillRect(x+15,y-2,1,1);ctx.fillRect(x+21,y-1,1,1);
    ctx.fillStyle='#ff3030';ctx.fillRect(x+15,y,1,1);
  },

  
  drawUnit: function(ctx,unit,x,y,grayed,sc,faction){
    sc=sc||1;
    faction=faction||'player'; // 'player', 'enemy', 'ally'
    const cls = unit.classId || "soldier";
    const classDef = getClassData(cls);
    
    // Check if new sprite system is defined
    if (classDef && classDef.sprites) {
      if (!this._imgCache) this._imgCache = {};
      
      // Determine which sprite sheet to use:
      // 1. Selected state (_selected) -> walk sprite (selected frames)
      // 2. Has direction (_direction) -> walk sprite (directional frames)
      // 3. Actually moving (vx/vy) -> walk sprite (directional frames)
      // 4. Otherwise -> stand sprite
      const isSelected = !!unit._selected;
      const hasDirection = !!unit._direction;
      const isMoving = (unit.vx || unit.vy);
      const useWalkSprites = isSelected || hasDirection || isMoving;
      
      // Get gender (default to 'm' if not specified)
      const gender = unit.gender || 'm';
      
      // Get sprite key based on gender with cross-gender fallback
      var sKey;
      if (gender === 'f') {
        // Female first, fallback to male
        sKey = useWalkSprites
          ? (classDef.sprites.walk_f || classDef.sprites.move_f || classDef.sprites.walk_m || classDef.sprites.move_m || '')
          : (classDef.sprites.stand_f || classDef.sprites.stand_m || '');
      } else {
        // Male first, fallback to female
        sKey = useWalkSprites
          ? (classDef.sprites.walk_m || classDef.sprites.move_m || classDef.sprites.walk_f || classDef.sprites.move_f || '')
          : (classDef.sprites.stand_m || classDef.sprites.stand_f || '');
      }
      
      // Skip if no valid sprite path
      if (!sKey) {
      } else if (!this._imgCache[sKey]) {
        const img = new Image();
        
        // Handle path resolution for subdirectories like classes/index.html
        if (['/classes/', '/characters/'].some(sub => window.location.pathname.includes(sub))) {
          img.src = '../assets/sprites/map/' + sKey;
        } else {
          img.src = 'assets/sprites/map/' + sKey;
        }

        this._imgCache[sKey] = { img: img, loaded: false };
        (function(key) {
          img.onload = function() { if (Sprites._imgCache[key]) Sprites._imgCache[key].loaded = true; };
          img.onerror = function() { 
            if (Sprites._imgCache[key]) {
              Sprites._imgCache[key].loaded = true; 
              Sprites._imgCache[key].error = true;
            }
          };
        })(sKey);
      }
      
      const sData = sKey ? this._imgCache[sKey] : null;
      if (sData && sData.loaded && !sData.error) {
        // Walk sprites: 15 frames in a single column
        // 0-3: Left, 4-7: Down, 8-11: Up, 12-14: Selected (no direction)
        // Stand sprites: 3 frames in a single column
        
        const isWalkSheet = useWalkSprites && (sKey.includes('walk') || sKey.includes('move'));
        const totalFrames = isWalkSheet ? 15 : 3;
        const sw = sData.img.width;
        const sh = sData.img.height / totalFrames;
        
        var frame, flipX = false;
        
        // Animation speed based on unit's spd stat
        // spd 5 -> slower (divisor 6), spd 15 -> normal (divisor 8), spd 25 -> faster (divisor 12)
        const spd = unit.spd || 10;
        const animSpeed = Math.max(4, Math.min(16, 8 + (spd - 10) / 2));
        
        if (isWalkSheet) {
          // Priority: Moving with direction > Selected > Stand
          // If unit is moving or has a direction, show directional walk sprite
          // Only show selected frames (12-14) when stationary AND selected
          const showDirectional = isMoving || hasDirection;
          
          if (unit._selected && !showDirectional) {
            // Selected but not moving - use frames 12-14 (selected animation)
            const animFrame = Math.floor(this._frameCounter / animSpeed) % 3;
            frame = 12 + animFrame;
          } else {
            // Moving or has direction - use directional frames
            let direction = unit._direction;
            if (!direction && isMoving) {
              if (unit.vx > 0) direction = 'right';
              else if (unit.vx < 0) direction = 'left';
              else if (unit.vy > 0) direction = 'down';
              else if (unit.vy < 0) direction = 'up';
            }
            direction = direction || 'down';
            
            // Map direction to base frame
            var baseFrame;
            if (direction === 'left') {
              baseFrame = 0;
            } else if (direction === 'right') {
              baseFrame = 0;  // Use left frames but flip
              flipX = true;
            } else if (direction === 'down') {
              baseFrame = 4;
            } else if (direction === 'up') {
              baseFrame = 8;
            } else {
              baseFrame = 4;  // Default to down
            }
            
            // Animate through 4 frames for each direction
            const animFrame = Math.floor(this._frameCounter / animSpeed) % 4;
            frame = baseFrame + animFrame;
          }
        } else {
          // Stand animation - simple idle frames
          frame = this._idleFrame();
        }
        
        ctx.save();
        if (grayed) {
          ctx.filter = 'grayscale(100%)';
        } else if (faction === 'enemy') {
          // Blue sprites -> Red for enemies (hue-rotate 140deg + saturate for vivid red)
          ctx.filter = 'hue-rotate(140deg) saturate(1.3) brightness(1.1)';
        } else if (faction === 'ally') {
          // Blue sprites -> Green for allies
          ctx.filter = 'hue-rotate(60deg) saturate(1.2)';
        }
        
        // Map sprites usually don't need scaling down if they are 16x32, we just draw them centered
        const drawW = sw * 1.5;
        const drawH = sh * 1.5;
        const dx = x + (GAME_CONFIG.TILE_SIZE - drawW) / 2;
        const dy = y + (GAME_CONFIG.TILE_SIZE - drawH) - 4;
        
        ctx.imageSmoothingEnabled = false;
        
        // Handle horizontal flip for right direction
        if (flipX) {
          ctx.translate(dx + drawW, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(sData.img, 0, frame * sh, sw, sh, 0, 0, drawW, drawH);
        } else {
          ctx.drawImage(sData.img, 0, frame * sh, sw, sh, dx, dy, drawW, drawH);
        }
        
        ctx.restore();
        
        // Draw HP bar
        if (unit.hp !== undefined && unit.maxHp) {
            const ratio = unit.hp / unit.maxHp;
            ctx.fillStyle = '#000'; ctx.fillRect(x + 3, y + 30, 26, 3);
            ctx.fillStyle = ratio > 0.5 ? '#40c040' : ratio > 0.25 ? '#c0c040' : '#c04040';
            ctx.fillRect(x + 4, y + 31, Math.floor(24 * ratio), 1);
        }
        if (unit.isBoss) {
            ctx.fillStyle = '#fc0';
            ctx.fillRect(x + 10, y - 2, 12, 2);
        }
      }
    }

  },




  _portraitCallbacks: [],

  preloadPortraits: function() {
    const chars = Object.keys(CHARACTERS);
    for (let i = 0; i < chars.length; i++) {
      const id = chars[i];
      if (!this._portraitCache[id]) {
        const img = new Image();
        img.src = 'portraits/' + id + '.png';
        this._portraitCache[id] = { img: img, loaded: false, failed: false };
        (function(cache, pid) {
          cache[pid].img.onload = function() { cache[pid].loaded = true; };
          cache[pid].img.onerror = function() { cache[pid].failed = true; };
        })(this._portraitCache, id);
      }
    }
  },

  // Preload all map sprites from classes.js
  preloadMapSprites: function(onProgress, onComplete) {
    if (!this._imgCache) this._imgCache = {};
    
    // Collect all sprite paths from CLASSES
    const spritesToLoad = [];
    for (var classId in CLASSES) {
      const cls = CLASSES[classId];
      if (cls.sprites) {
        // Add all sprite variants
        const keys = ['stand_m', 'stand_f', 'walk_m', 'walk_f', 'move_m', 'move_f'];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (cls.sprites[key]) {
            spritesToLoad.push(cls.sprites[key]);
          }
        }
      }
    }
    
    // Remove duplicates
    const uniqueSprites = [];
    for (let j = 0; j < spritesToLoad.length; j++) {
      if (uniqueSprites.indexOf(spritesToLoad[j]) === -1) {
        uniqueSprites.push(spritesToLoad[j]);
      }
    }
    
    let loaded = 0;
    const total = uniqueSprites.length;
    
    if (total === 0) {
      if (onComplete) onComplete();
      return;
    }
    
    for (let k = 0; k < uniqueSprites.length; k++) {
      const sKey = uniqueSprites[k];
      if (!this._imgCache[sKey]) {
        const img = new Image();
        img.src = 'assets/sprites/map/' + sKey;
        this._imgCache[sKey] = { img: img, loaded: false };
        
        (function(key, self) {
          img.onload = function() {
            self._imgCache[key].loaded = true;
            loaded++;
            if (onProgress) onProgress(loaded, total);
            if (loaded >= total && onComplete) onComplete();
          };
          img.onerror = function() {
            self._imgCache[key].loaded = true;
            self._imgCache[key].error = true;
            loaded++;
            if (onProgress) onProgress(loaded, total);
            if (loaded >= total && onComplete) onComplete();
          };
        })(sKey, this);
      } else {
        loaded++;
        if (onProgress) onProgress(loaded, total);
      }
    }
    
    // If all already cached, call complete immediately
    if (loaded >= total && onComplete) onComplete();
  },

  onPortraitReady: function(cb) { this._portraitCallbacks.push(cb); },

  drawGenericPortrait: function(ctx, unit, w, h) {
    const cls = getClassData(unit.classId);
    const colors = this.getUnitColors(unit.faction);
    const seed = (unit.classId || "").length * 31 + (unit.level || 1) * 7;
    ctx.fillStyle = unit.faction === 'enemy' ? '#2a1018' : '#182a10';
    ctx.fillRect(0, 0, w, h);
    const skinTones = ['#dba','#ecb','#fdb','#ca9','#eda'];
    ctx.fillStyle = skinTones[seed % skinTones.length];
    ctx.fillRect(w*0.25, h*0.2, w*0.5, h*0.55);
    const hairColors = ['#444','#654','#543','#765','#333','#876'];
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
    const ch = CHARACTERS[charId];
    if (!ch) { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, h); return; }
    if (!this._portraitCache[charId]) {
      const img = new Image();
      img.src = 'portraits/' + charId + '.png';
      this._portraitCache[charId] = { img: img, loaded: false, failed: false };
      img.onload = function() { Sprites._portraitCache[charId].loaded = true; };
      img.onerror = function() { Sprites._portraitCache[charId].failed = true; };
    }
    const cached = this._portraitCache[charId];
    if (cached.loaded) { ctx.drawImage(cached.img, 0, 0, w, h); return; }
    if (!ch.portrait) { ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, h); return; }
    const p = ch.portrait;
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
    const s = GAME_CONFIG.TILE_SIZE;
    const alpha = 0.3 + 0.25 * Math.sin(frame * 0.1);
    // Outer glow
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,0,0.8)';
    ctx.shadowBlur = 8 + 4 * Math.sin(frame * 0.08);
    ctx.fillStyle = 'rgba(255,255,0,' + alpha + ')';
    ctx.fillRect(x+2, y+2, s-4, s-4);
    ctx.restore();
    // Animated border
    ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, s-2, s-2);
    // Inner diamond pulse
    const da = 0.4 + 0.3 * Math.sin(frame * 0.12);
    ctx.save();
    ctx.globalAlpha = da;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x+s/2, y+4); ctx.lineTo(x+s-4, y+s/2);
    ctx.lineTo(x+s/2, y+s-4); ctx.lineTo(x+4, y+s/2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1;
  },

};

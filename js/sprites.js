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
      floor:{base:"#c8c0b0",dark:"#b0a898",light:"#dcd4c4"} }[type] || {base:"#58b848",dark:"#48a838",light:"#68c858"};
  },

  drawTerrain: function(ctx, type, x, y) {
    var s=GAME_CONFIG.TILE_SIZE, seed=this._seed(x,y), self=this;
    const rng = function(n) { return self._rng(seed, n); };
    const R = function(rx,ry,rw,rh,rc) { ctx.fillStyle=rc; ctx.fillRect(rx,ry,rw,rh); };
    const P = function(px,py,pc) { ctx.fillStyle=pc; ctx.fillRect(px,py,1,1); };

    if(type==='plain'){
      // GBA Blazing Blade style warm green grass
      R(x,y,s,s,'#58b848');
      var gr=['#48a838','#58b848','#68c858','#50b040','#60c050'];
      for(let py=0;py<s;py++)for(let px=0;px<s;px++){
        var ck=(px+py)%2,z=((py>>2)+(px>>3)+seed)%5;
        P(x+px,y+py,gr[z]);
      }
      // Subtle grass tufts
      for(let i=0;i<3+(seed%3);i++){
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
      for(let py=0;py<s;py++)for(let px=0;px<s;px++){
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
      // Stone bricks with clear mortar lines
      R(x,y,s,s,'#807870');
      for(let row=0;row<4;row++){var ry=y+row*8,off=(row%2)*8;
        for(let col=0;col<3;col++){var bx=x+off+col*16;
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
      // 宮殿室內石板地板 — 大理石格紋
      R(x,y,s,s,'#c8c0b0');
      // 大理石方格紋（8x8 checkerboard）
      for(let py=0;py<s;py+=8)for(let px=0;px<s;px+=8){
        var chk=((px+py)/8)%2;
        R(x+px,y+py,8,8,chk?'#c0b8a8':'#d0c8b8');
      }
      // 石板接縫線（水平）
      for(let gy=8;gy<s;gy+=8){R(x,y+gy,s,1,'#a09888');}
      // 石板接縫線（垂直）
      for(let gx=8;gx<s;gx+=8){R(x+gx,y,1,s,'#a09888');}
      // 輕微光澤（左上角高光）
      R(x+1,y+1,4,1,'#ddd8cc');R(x+1,y+2,1,3,'#ddd8cc');
      R(x+9,y+1,4,1,'#ddd8cc');R(x+17,y+9,4,1,'#ddd8cc');

    }else if(type==='hill'){
      R(x,y,s,s,'#58b848');
      ctx.fillStyle='#68c050';
      ctx.beginPath();ctx.moveTo(x+4,y+28);ctx.quadraticCurveTo(x+16,y+6,x+28,y+28);ctx.fill();
      if(seed%2===0){ // Variant A
        ctx.fillStyle='#88e068'; ctx.beginPath();ctx.moveTo(x+10,y+22);ctx.quadraticCurveTo(x+16,y+8,x+22,y+22);ctx.fill();
      } else { // Variant B - darker/sturdier
        ctx.fillStyle='#50a040'; ctx.beginPath();ctx.moveTo(x+6,y+24);ctx.quadraticCurveTo(x+16,y+12,x+26,y+24);ctx.fill();
      }
    }else if(type==='swamp'){
      R(x,y,s,s,seed%2===0 ? '#3a5828' : '#2d4420');
      ctx.fillStyle='rgba(20,40,10,0.6)';
      ctx.beginPath();ctx.arc(x+12+(seed%8),y+14+(seed%6),8,0,Math.PI*2);ctx.fill();
    }else if(type==='cliff'){
      R(x,y,s,s,'#585048');
      R(x,y,s,6,'#58a848');
      R(x+(seed%4),y+6,s-(seed%4),24,seed%2===0?'#706858':'#605848');
    }else if(type==='pass'){
      R(x,y,s,s,'#a09070');
      R(x+8,y,16,s,'#b0a880');
      if(seed%2===0) R(x+12,y+4,8,8,'#888070');
    }else if(type==='road'){
      R(x,y,s,s,seed%2===0 ? '#c8b870' : '#b8a860');
      R(x+6,y,4,s,'rgba(0,0,0,0.1)'); R(x+22,y,4,s,'rgba(0,0,0,0.1)');
    }else if(type==='basin'){
      R(x,y,s,s,'#48a038');
      ctx.fillStyle=seed%2===0 ? '#3878a8' : '#4a90c0';
      ctx.beginPath();ctx.arc(x+16,y+18,6,0,Math.PI*2);ctx.fill();
    }else if(type==='sea'){
      R(x,y,s,s,seed%2===0 ? '#1a5898' : '#144080');
      R(x+(seed%16),y+8,12,1,'rgba(255,255,255,0.2)');
    }else if(type==='desert'){
      R(x,y,s,s,seed%2===0 ? '#c8a870' : '#d8bc80');
      P(x+10+(seed%10),y+10+(seed%10),'#a88e58');
    }else if(type==='bridge'){
      R(x,y,s,s,'#3888d0');
      R(x+4,y,24,s,seed%2===0 ? '#9a7850' : '#886840');
    }else if(type==='ruins'){
      R(x,y,s,s,'#58b848');
      R(x+6,y+6,20,20,seed%2===0 ? '#808070' : '#707060');
    }else if(type==='stairs'){
      R(x,y,s,s,'#c8c0b0');
      for(let i=0;i<4;i++) R(x,y+i*8,s,4,`rgba(0,0,0,${0.1+i*0.05})`);
    }else if(type==='brazier'){
      R(x,y,s,s,'#c8c0b0');
      R(x+12,y+12,8,8,'#404030');
      ctx.fillStyle=seed%2===0 ? '#ff4000' : '#ff8000';
      ctx.beginPath();ctx.arc(x+16,y+14,4,0,Math.PI*2);ctx.fill();

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

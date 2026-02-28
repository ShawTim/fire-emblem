const fs = require('fs');

let code = fs.readFileSync('/home/openclaw/work/fire-emblem/js/unit.js', 'utf8');

// Change the stat application to sum personal baseStats + class baseStats
const statInitRegex = /\/\/ Stats\s+const bs = data\.baseStats \|\| data\.stats \|\| \{\};\s+this\.maxHp = bs\.hp \|\| 20;\s+this\.hp = this\.maxHp;\s+this\.str = bs\.str \|\| 0;\s+this\.mag = bs\.mag \|\| 0;\s+this\.skl = bs\.skl \|\| 0;\s+this\.spd = bs\.spd \|\| 0;\s+this\.lck = bs\.lck \|\| 0;\s+this\.def = bs\.def \|\| 0;\s+this\.res = bs\.res \|\| 0;/m;

const newStatInit = `// Stats
    const bs = data.baseStats || data.stats || {};
    const clsStats = getClassData(this.classId).baseStats || {};
    this.maxHp = (bs.hp || 0) + (clsStats.hp || 0) || 20;
    this.hp = this.maxHp;
    this.str = (bs.str || 0) + (clsStats.str || 0);
    this.mag = (bs.mag || 0) + (clsStats.mag || 0);
    this.skl = (bs.skl || 0) + (clsStats.skl || 0);
    this.spd = (bs.spd || 0) + (clsStats.spd || 0);
    this.lck = (bs.lck || 0) + (clsStats.lck || 0);
    this.def = (bs.def || 0) + (clsStats.def || 0);
    this.res = (bs.res || 0) + (clsStats.res || 0);`;

code = code.replace(statInitRegex, newStatInit);

// Change getEquippedWeapon to check prf
const getEqRegex = /if \(item\.usesLeft <= 0\) continue;\s+if \(\!cls\.weapons\.includes\(item\.type\) && \!item\.magic\) continue;/;
const newGetEq = `if (item.usesLeft <= 0) continue;
      if (item.prf && !item.prf.includes(this.charId) && !item.prf.includes(this.classId)) continue;
      if (!cls.weapons.includes(item.type) && !item.magic) continue;`;
// Actually wait, let's just make sure item.prf checking is robust
// Let's replace the whole method body if we can

fs.writeFileSync('/home/openclaw/work/fire-emblem/js/unit.js', code);
console.log("unit.js patched");

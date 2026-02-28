const fs = require('fs');

let code = fs.readFileSync('/home/openclaw/work/fire-emblem/js/combat.js', 'utf8');

const regexToReplace = /\/\/ Attacker stats\s+const atkPow = \(atkWpn\.magic \? attacker\.mag : attacker\.str\) \+ atkWpn\.atk \+ triBonus\.atk;\s+const defStat = defender\.getDefAt\(defTerrain, atkWpn\.magic\);\s+const atkDmg = Math\.max\(0, atkPow - defStat\);\s+const atkHit = Math\.max\(0, Math\.min\(100, attacker\.getHit\(\) \+ triBonus\.hit - defender\.getAvo\(defTerrain\)\)\);\s+const atkCrit = Math\.max\(0, attacker\.getCrit\(\) - defender\.lck\);\s+const atkDouble = attacker\.spd - defender\.spd >= 5;\s+\/\/ Effective bonus\s+let atkEffMult = 1;\s+if \(atkWpn\.effective && atkWpn\.effective\.length > 0\) \{\s+const defCls = getClassData\(defender\.classId\);\s+const defTags = defCls\.tags \|\| \[\];\s+if \(atkWpn\.effective\.some\(t => defTags\.includes\(t\)\)\) atkEffMult = 3;\s+\}/m;

const replacement = `// Effective bonus (Attacker)
  let atkEffMult = 1;
  const defCls = getClassData(defender.classId);
  const defTags = defCls.tags || [];
  if (atkWpn.effective) {
    if (atkWpn.effective[defender.classId]) {
      atkEffMult = atkWpn.effective[defender.classId];
    } else {
      for (const tag of defTags) {
        if (atkWpn.effective[tag]) {
          atkEffMult = atkWpn.effective[tag];
          break;
        }
      }
    }
  }

  // Attacker stats
  const atkWeaponPower = (atkWpn.atk * atkEffMult) + triBonus.atk;
  const atkPow = (atkWpn.magic ? attacker.mag : attacker.str) + atkWeaponPower;
  const defStat = defender.getDefAt(defTerrain, atkWpn.magic);
  let atkDmg = Math.max(0, atkPow - defStat);
  const atkHit = Math.max(0, Math.min(100, attacker.getHit() + triBonus.hit - defender.getAvo(defTerrain)));
  const atkCrit = Math.max(0, attacker.getCrit() - defender.lck);
  const atkDouble = attacker.spd - defender.spd >= 5;`;

code = code.replace(regexToReplace, replacement);

// Same for defender counter!
const defRegexToReplace = /if \(defWpn && defWpn\.type !== 'staff' && defWpn\.range\.includes\(dist\)\) \{\s+canCounter = true;\s+const defPow = \(defWpn\.magic \? defender\.mag : defender\.str\) \+ defWpn\.atk \+ triBonusDef\.atk;\s+const atkDefStat = attacker\.getDefAt\(atkTerrain, defWpn\.magic\);\s+defDmg = Math\.max\(0, defPow - atkDefStat\);/m;

const defReplacement = `if (defWpn && defWpn.type !== 'staff' && defWpn.range.includes(dist)) {
    canCounter = true;
    
    // Effective bonus (Defender)
    let defEffMult = 1;
    const atkCls = getClassData(attacker.classId);
    const atkTags = atkCls.tags || [];
    if (defWpn.effective) {
      if (defWpn.effective[attacker.classId]) {
        defEffMult = defWpn.effective[attacker.classId];
      } else {
        for (const tag of atkTags) {
          if (defWpn.effective[tag]) {
            defEffMult = defWpn.effective[tag];
            break;
          }
        }
      }
    }

    const defWeaponPower = (defWpn.atk * defEffMult) + triBonusDef.atk;
    const defPow = (defWpn.magic ? defender.mag : defender.str) + defWeaponPower;
    const atkDefStat = attacker.getDefAt(atkTerrain, defWpn.magic);
    defDmg = Math.max(0, defPow - atkDefStat);`;

code = code.replace(defRegexToReplace, defReplacement);

// Remove the old atkDmg calculation that was accidentally applying atkEffMult again
const badDmgCalc = /if \(atkEffMult > 1\) atkDmg = Math\.floor\(atkDmg \* atkEffMult\);/m;
code = code.replace(badDmgCalc, '');

fs.writeFileSync('/home/openclaw/work/fire-emblem/js/combat.js', code);
console.log("combat.js patched");

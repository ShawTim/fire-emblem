const fs = require('fs');
let code = fs.readFileSync('/home/openclaw/work/fire-emblem/js/unit.js', 'utf8');

const oldFunc = `getEquippedWeapon() {
    const cls = getClassData(this.classId);
    for (const item of this.items) {
      if (item.type === 'consumable' || item.type === 'promotion') continue;
      if (item.usesLeft <= 0) continue;
      if (cls.weapons.includes(item.type) || item.type === 'staff') return item;
    }
    return null;
  }`;

const newFunc = `getEquippedWeapon() {
    const cls = getClassData(this.classId);
    for (const item of this.items) {
      if (item.type === 'consumable' || item.type === 'promotion') continue;
      if (item.usesLeft <= 0) continue;
      if (item.prf && !(item.prf.includes(this.charId) || item.prf.includes(this.classId))) continue;
      if (cls.weapons.includes(item.type) || item.type === 'staff') return item;
    }
    return null;
  }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('/home/openclaw/work/fire-emblem/js/unit.js', code);
console.log("getEquippedWeapon patched");

// classes.js — Class definitions and promotion paths

const CLASSES = {
  lord: {
    name: '領主', weapons: ['sword'], mov: 5,
    promo: [{ to: 'masterLord', item: 'starCrest' }],
    caps: { hp:60, str:20, mag:15, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  masterLord: {
    name: '聖王', weapons: ['sword','lance'], mov: 6, promoted: true,
    caps: { hp:60, str:25, mag:20, skl:25, spd:25, lck:30, def:25, res:25 },
    bonus: { hp:3, str:2, mag:1, skl:2, spd:2, def:2, res:3 }
  },
  cavalier: {
    name: '騎士', weapons: ['sword','lance'], mov: 7, tags: ['cavalry','mounted'],
    promo: [{ to: 'paladin' }, { to: 'greatKnight' }],
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  paladin: {
    name: '聖騎士', weapons: ['sword','lance'], mov: 8, promoted: true, tags: ['cavalry','mounted'],
    caps: { hp:60, str:25, mag:10, skl:25, spd:25, lck:30, def:25, res:25 },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:2 }
  },
  greatKnight: {
    name: '大騎士', weapons: ['sword','lance','axe'], mov: 6, promoted: true, tags: ['cavalry','mounted','armored'],
    caps: { hp:60, str:28, mag:5, skl:20, spd:18, lck:30, def:28, res:15 },
    bonus: { hp:4, str:3, skl:1, spd:1, def:4, res:1 }
  },
  archer: {
    name: '弓箭手', weapons: ['bow'], mov: 5,
    promo: [{ to: 'sniper' }, { to: 'ranger' }],
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  sniper: {
    name: '狙擊手', weapons: ['bow'], mov: 6, promoted: true,
    caps: { hp:60, str:25, mag:5, skl:30, spd:25, lck:30, def:20, res:20 },
    bonus: { hp:3, str:2, skl:3, spd:2, def:2, res:1 }
  },
  ranger: {
    name: '遊俠', weapons: ['bow','sword'], mov: 7, promoted: true, tags: ['mounted'],
    caps: { hp:60, str:22, mag:5, skl:25, spd:25, lck:30, def:22, res:22 },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:2 }
  },
  fighter: {
    name: '戰士', weapons: ['axe'], mov: 5,
    promo: [{ to: 'warrior' }, { to: 'hero' }],
    caps: { hp:60, str:22, mag:5, skl:18, spd:18, lck:30, def:18, res:15 }
  },
  warrior: {
    name: '勇者', weapons: ['axe','bow'], mov: 6, promoted: true,
    caps: { hp:60, str:30, mag:5, skl:24, spd:22, lck:30, def:22, res:15 },
    bonus: { hp:4, str:3, skl:1, spd:1, def:2, res:1 }
  },
  hero: {
    name: '英雄', weapons: ['sword','axe'], mov: 6, promoted: true,
    caps: { hp:60, str:25, mag:5, skl:28, spd:26, lck:30, def:22, res:18 },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:2 }
  },
  mercenary: {
    name: '傭兵', weapons: ['sword'], mov: 5,
    promo: [{ to: 'hero' }, { to: 'swordmaster' }],
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  swordmaster: {
    name: '劍聖', weapons: ['sword'], mov: 6, promoted: true,
    caps: { hp:60, str:22, mag:5, skl:30, spd:30, lck:30, def:18, res:22 },
    bonus: { hp:2, str:2, skl:3, spd:3, def:1, res:2 }
  },
  cleric: {
    name: '修女', weapons: ['staff'], mov: 5,
    promo: [{ to: 'bishop' }, { to: 'valkyrie' }],
    caps: { hp:60, str:5, mag:20, skl:20, spd:20, lck:30, def:10, res:25 }
  },
  bishop: {
    name: '司祭', weapons: ['staff','fire','thunder','wind'], mov: 5, promoted: true,
    caps: { hp:60, str:5, mag:28, skl:25, spd:22, lck:30, def:15, res:30 },
    bonus: { hp:3, mag:3, skl:2, spd:1, def:2, res:3 }
  },
  valkyrie: {
    name: '聖女騎士', weapons: ['staff','fire'], mov: 7, promoted: true, tags: ['mounted'],
    caps: { hp:60, str:5, mag:25, skl:22, spd:25, lck:30, def:12, res:28 },
    bonus: { hp:2, mag:2, skl:2, spd:3, def:1, res:3 }
  },
  mage: {
    name: '魔法師', weapons: ['fire','thunder','wind'], mov: 5,
    promo: [{ to: 'sage' }, { to: 'mageKnight' }],
    caps: { hp:60, str:5, mag:20, skl:20, spd:20, lck:30, def:15, res:20 }
  },
  sage: {
    name: '賢者', weapons: ['fire','thunder','wind','staff'], mov: 5, promoted: true,
    caps: { hp:60, str:5, mag:28, skl:25, spd:24, lck:30, def:18, res:25 },
    bonus: { hp:3, mag:3, skl:2, spd:2, def:2, res:2 }
  },
  mageKnight: {
    name: '魔法騎士', weapons: ['fire','thunder','wind'], mov: 7, promoted: true, tags: ['mounted'],
    caps: { hp:60, str:5, mag:25, skl:22, spd:25, lck:30, def:18, res:22 },
    bonus: { hp:3, mag:2, skl:2, spd:3, def:2, res:2 }
  },
  wyvernRider: {
    name: '飛龍騎士', weapons: ['lance'], mov: 7, tags: ['flying','mounted'],
    promo: [{ to: 'wyvernLord' }],
    caps: { hp:60, str:22, mag:5, skl:18, spd:18, lck:30, def:22, res:10 }
  },
  wyvernLord: {
    name: '飛龍將', weapons: ['lance','sword'], mov: 8, promoted: true, tags: ['flying','mounted'],
    caps: { hp:60, str:28, mag:5, skl:24, spd:22, lck:30, def:28, res:15 },
    bonus: { hp:4, str:2, skl:2, spd:2, def:3, res:2 }
  },
  // Enemy-only classes
  soldier: {
    name: '士兵', weapons: ['lance'], mov: 5,
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  knight: {
    name: '重裝騎士', weapons: ['lance'], mov: 4, tags: ['armored'],
    caps: { hp:60, str:24, mag:5, skl:18, spd:12, lck:30, def:28, res:10 }
  },
  darkMage: {
    name: '暗黑魔法師', weapons: ['dark'], mov: 5,
    caps: { hp:60, str:5, mag:25, skl:20, spd:18, lck:30, def:15, res:22 }
  },
  brigand: {
    name: '山賊', weapons: ['axe'], mov: 5,
    caps: { hp:60, str:20, mag:5, skl:14, spd:16, lck:30, def:14, res:10 }
  },
  skeleton: {
    name: '骷髏兵', weapons: ['lance','axe'], mov: 5, tags: ['undead'],
    caps: { hp:60, str:18, mag:5, skl:12, spd:14, lck:0, def:16, res:5 }
  }
};

function getClassDef(classId) {
  return CLASSES[classId] || CLASSES.soldier;
}
// Alias for compatibility
function getClassData(classId) {
  return getClassDef(classId);
}

// classes.js — Class definitions and promotion paths

const CLASSES = {
  lord: {
    name: '領主', weapons: ['sword'], mov: 5,
    promo: [{ to: 'masterLord', item: 'starCrest' }],
    caps: { hp:60, str:20, mag:15, skl:20, spd:20, lck:30, def:20, res:20 },
    sprites: { stand: '/assets/sprites/map/lord_f_stand.png', move: '/assets/sprites/map/lord_f_move.png' }
  },
  masterLord: {
    name: '聖王', weapons: ['sword','lance'], mov: 6, promoted: true,
    caps: { hp:60, str:25, mag:20, skl:25, spd:25, lck:30, def:25, res:25 },
    bonus: { hp:3, str:2, mag:1, skl:2, spd:2, def:2, res:3 }
  },
  cavalier: {
    name: '騎士', weapons: ['sword','lance'], mov: 7, tags: ['cavalry','mounted'],
    promo: [{ to: 'paladin' }, { to: 'greatKnight' }],
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 },
    sprites: { stand: '/assets/sprites/map/cavalier_stand.png', move: '/assets/sprites/map/cavalier_move.png' }
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
    sprites: { stand: '/assets/sprites/map/archer_stand.png', move: '/assets/sprites/map/archer_move.png', frames: 3 },
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  sniper: {
    name: '狙擊手', weapons: ['bow'], mov: 6, promoted: true,
    sprites: { stand: '/assets/sprites/map/sniper_stand.png', move: '/assets/sprites/map/sniper_move.png', frames: 3 },
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
    caps: { hp:60, str:22, mag:5, skl:18, spd:18, lck:30, def:18, res:15 },
    sprites: { stand: '/assets/sprites/map/fighter_stand.png', move: '/assets/sprites/map/fighter_move.png' }
  },
  warrior: {
    name: '勇者', weapons: ['axe','bow'], mov: 6, promoted: true,
    caps: { hp:60, str:30, mag:5, skl:24, spd:22, lck:30, def:22, res:15 },
    bonus: { hp:4, str:3, skl:1, spd:1, def:2, res:1 }
  },
  hero: {
    name: '英雄', weapons: ['sword','axe'], mov: 6, promoted: true,
    sprites: { stand: '/assets/sprites/map/hero_stand.png', move: '/assets/sprites/map/hero_move.png', frames: 3 },
    caps: { hp:60, str:25, mag:5, skl:28, spd:26, lck:30, def:22, res:18 },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:2 }
  },
  mercenary: {
    name: '傭兵', weapons: ['sword'], mov: 5,
    promo: [{ to: 'hero' }, { to: 'swordmaster' }],
    sprites: { stand: '/assets/sprites/map/mercenary_stand.png', move: '/assets/sprites/map/mercenary_move.png', frames: 3 },
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  swordmaster: {
    name: '劍聖', weapons: ['sword'], mov: 6, promoted: true,
    sprites: { stand: '/assets/sprites/map/swordmaster_stand.png', move: '/assets/sprites/map/swordmaster_move.png', frames: 3 },
    caps: { hp:60, str:22, mag:5, skl:30, spd:30, lck:30, def:18, res:22 },
    bonus: { hp:2, str:2, skl:3, spd:3, def:1, res:2 }
  },
  cleric: {
    name: '修女', weapons: ['staff'], mov: 5,
    promo: [{ to: 'bishop' }, { to: 'valkyrie' }],
    sprites: { stand: '/assets/sprites/map/cleric_stand.png', move: '/assets/sprites/map/cleric_move.png', frames: 3 },
    caps: { hp:60, str:5, mag:20, skl:20, spd:20, lck:30, def:10, res:25 }
  },
  bishop: {
    name: '司祭', weapons: ['staff','fire','thunder','wind'], mov: 5, promoted: true,
    sprites: { stand: '/assets/sprites/map/bishop_stand.png', move: '/assets/sprites/map/bishop_move.png', frames: 3 },
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
    sprites: { stand: '/assets/sprites/map/mage_stand.png', move: '/assets/sprites/map/mage_move.png', frames: 3 },
    caps: { hp:60, str:5, mag:20, skl:20, spd:20, lck:30, def:15, res:20 }
  },
  sage: {
    name: '賢者', weapons: ['fire','thunder','wind','staff'], mov: 5, promoted: true,
    sprites: { stand: '/assets/sprites/map/sage_stand.png', move: '/assets/sprites/map/sage_move.png', frames: 3 },
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
  pegasusKnight: {
    name: '天馬騎士', weapons: ['lance'], mov: 7, tags: ['flying','mounted'],
    promo: [{ to: 'falconKnight' }],
    caps: { hp:60, str:18, mag:10, skl:22, spd:24, lck:30, def:16, res:22 }
  },
  falconKnight: {
    name: '隼騎士', weapons: ['lance','sword'], mov: 8, promoted: true, tags: ['flying','mounted'],
    caps: { hp:60, str:22, mag:15, skl:26, spd:28, lck:30, def:20, res:28 },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:3 }
  },
  thief: {
    name: '盜賊', weapons: ['sword'], mov: 6,
    promo: [{ to: 'assassin' }],
    sprites: { stand: '/assets/sprites/map/thief_stand.png', move: '/assets/sprites/map/thief_move.png', frames: 3 },
    caps: { hp:60, str:18, mag:5, skl:24, spd:26, lck:30, def:14, res:16 }
  },
  assassin: {
    name: '刺客', weapons: ['sword'], mov: 6, promoted: true,
    sprites: { stand: '/assets/sprites/map/assassin_stand.png', move: '/assets/sprites/map/assassin_move.png', frames: 3 },
    caps: { hp:60, str:22, mag:5, skl:30, spd:30, lck:30, def:18, res:20 },
    bonus: { hp:2, str:2, skl:3, spd:3, def:1, res:2 },
    critBonus: 15
  },
  general: {
    name: '將軍', weapons: ['lance','axe'], mov: 4, promoted: true, tags: ['armored'],
    sprites: { stand: '/assets/sprites/map/general_stand.png', move: '/assets/sprites/map/general_move.png', frames: 3 },
    caps: { hp:60, str:28, mag:5, skl:22, spd:14, lck:30, def:30, res:14 },
    bonus: { hp:5, str:3, skl:1, spd:0, def:5, res:1 }
  },
  // Enemy-only classes
  soldier: {
    name: '士兵', weapons: ['lance'], mov: 5,
    sprites: { stand: '/assets/sprites/map/soldier_stand.png', move: '/assets/sprites/map/soldier_move.png', frames: 3 },
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 }
  },
  knight: {
    name: '重裝騎士', weapons: ['lance'], mov: 4, tags: ['armored'],
    sprites: { stand: '/assets/sprites/map/knight_stand.png', move: '/assets/sprites/map/knight_move.png', frames: 3 },
    caps: { hp:60, str:24, mag:5, skl:18, spd:12, lck:30, def:28, res:10 }
  },
  darkMage: {
    name: '暗黑魔法師', weapons: ['dark'], mov: 5,
    sprites: { stand: '/assets/sprites/map/darkmage_stand.png', move: '/assets/sprites/map/darkmage_move.png', frames: 3 },
    caps: { hp:60, str:5, mag:25, skl:20, spd:18, lck:30, def:15, res:22 }
  },
  brigand: {
    name: '山賊', weapons: ['axe'], mov: 5,
    sprites: { stand: '/assets/sprites/map/brigand_stand.png', move: '/assets/sprites/map/brigand_move.png', frames: 3 },
    caps: { hp:60, str:20, mag:5, skl:14, spd:16, lck:30, def:14, res:10 }
  },
  skeleton: {
    name: '骷髏兵', weapons: ['lance','axe'], mov: 5, tags: ['undead'],
    sprites: { stand: '/assets/sprites/map/skeleton_stand.png', move: '/assets/sprites/map/skeleton_move.png', frames: 3 },
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

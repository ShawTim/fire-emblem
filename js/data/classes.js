// classes.js — Class definitions and promotion paths

const CLASSES = {
  lord: {
    name: '領主', weapons: ['sword'], mov: 5,
    promo: [{ to: 'masterLord', item: 'starCrest' }],
    caps: { hp:60, str:20, mag:15, skl:20, spd:20, lck:30, def:20, res:20 },
    sprites: { stand_m: 'lord_M_stand.png', stand_f: 'lord_F_stand.png', walk_m: 'lord_M_walk.png', walk_f: 'lord_F_move.png' }
  },
  masterLord: { 
    name: '聖王', weapons: ['sword','lance'], mov: 6, promoted: true,
    caps: { hp:60, str:25, mag:20, skl:25, spd:25, lck:30, def:25, res:25 },
    sprites: { stand_m: '', stand_f: '', walk_m: '', walk_f: '' },
    sprites: { stand_m: 'masterLord_M_stand.png', stand_f: 'masterLord_F_stand.png', walk_m: 'masterLord_M_walk.png', walk_f: 'masterLord_F_walk.png' },
    bonus: { hp:3, str:2, mag:1, skl:2, spd:2, def:2, res:3 }
  },
  cavalier: {
    name: '騎士', weapons: ['sword','lance'], mov: 7, tags: ['cavalry','mounted'],
    promo: [{ to: 'paladin' }, { to: 'greatKnight' }],
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 },
    sprites: { stand_m: 'cavalier_M_stand.png', stand_f: 'cavalier_F_stand.png', walk_m: 'cavalier_M_walk.png', walk_f: 'cavalier_F_walk.png' }
  },
  paladin: { 
    name: '聖騎士', weapons: ['sword','lance'], mov: 8, promoted: true, tags: ['cavalry','mounted'],
    caps: { hp:60, str:25, mag:10, skl:25, spd:25, lck:30, def:25, res:25 },
    sprites: { stand_m: 'paladin_M_stand.png', stand_f: 'paladin_F_stand.png', walk_m: 'paladin_M_walk.png', walk_f: 'paladin_F_walk.png' },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:2 }
  },
  greatKnight: { 
    name: '大騎士', weapons: ['sword','lance','axe'], mov: 6, promoted: true, tags: ['cavalry','mounted','armored'],
    caps: { hp:60, str:28, mag:5, skl:20, spd:18, lck:30, def:28, res:15 },
    sprites: { stand_m: 'greatKnight_M_stand.png', stand_f: 'greatKnight_F_stand.png', walk_m: 'greatKnight_M_walk.png', walk_f: 'greatKnight_F_walk.png' },
    bonus: { hp:4, str:3, skl:1, spd:1, def:4, res:1 }
  },
  archer: {
    name: '弓箭手', weapons: ['bow'], mov: 5,
    promo: [{ to: 'sniper' }, { to: 'ranger' }],
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 },
    sprites: { stand_m: 'archer_M_stand.png', stand_f: 'archer_F_stand.png', walk_m: 'archer_M_walk.png', walk_f: 'archer_F_walk.png' }
  },
  sniper: {
    name: '狙擊手', weapons: ['bow'], mov: 6, promoted: true,
    caps: { hp:60, str:25, mag:5, skl:30, spd:25, lck:30, def:20, res:20 },
    sprites: { stand_m: 'sniper_M_stand.png', stand_f: 'sniper_F_stand.png', walk_m: 'sniper_M_walk.png', walk_f: 'sniper_F_walk.png' },
    bonus: { hp:3, str:2, skl:3, spd:2, def:2, res:1 }
  },
  ranger: { 
    name: '遊俠', weapons: ['bow','sword'], mov: 7, promoted: true, tags: ['mounted'],
    caps: { hp:60, str:22, mag:5, skl:25, spd:25, lck:30, def:22, res:22 },
    sprites: { stand_m: 'ranger_M_stand.png', stand_f: 'ranger_F_stand.png', walk_m: 'ranger_M_walk.png', walk_f: 'ranger_F_walk.png' },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:2 }
  },
  fighter: {
    name: '戰士', weapons: ['axe'], mov: 5,
    promo: [{ to: 'warrior' }, { to: 'hero' }],
    caps: { hp:60, str:22, mag:5, skl:18, spd:18, lck:30, def:18, res:15 },
    sprites: { stand_m: 'fighter_M_stand.png', stand_f: 'fighter_F_stand.png', walk_m: 'fighter_M_walk.png', walk_f: 'fighter_F_walk.png' }
  },
  warrior: {
    name: '勇者', weapons: ['axe','bow'], mov: 6, promoted: true,
    caps: { hp:60, str:30, mag:5, skl:24, spd:22, lck:30, def:22, res:15 },
    sprites: { stand_m: 'warrior_M_stand.png', stand_f: 'warrior_F_stand.png', walk_m: 'warrior_M_walk.png', walk_f: 'warrior_F_walk.png' },
    bonus: { hp:4, str:3, skl:1, spd:1, def:2, res:1 }
  },
  hero: { 
    name: '英雄', weapons: ['sword','axe'], mov: 6, promoted: true,
    sprites: { stand_m: 'hero_M_stand.png', stand_f: 'hero_F_stand.png', walk_m: 'hero_M_walk.png', walk_f: 'hero_F_walk.png' },
    caps: { hp:60, str:25, mag:5, skl:28, spd:26, lck:30, def:22, res:18  },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:2 }
  },
  mercenary: {
    name: '傭兵', weapons: ['sword'], mov: 5,
    promo: [{ to: 'hero' }, { to: 'swordmaster' }],
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 },
    sprites: { stand_m: 'mercenary_M_stand.png', stand_f: '', walk_m: 'mercenary_M_walk.png', walk_f: '' }
  },
  swordmaster: {
    name: '劍聖', weapons: ['sword'], mov: 6, promoted: true,
    caps: { hp:60, str:22, mag:5, skl:30, spd:30, lck:30, def:18, res:22 },
    sprites: { stand_m: 'swordmaster_stand.png', stand_f: '', walk_m: 'swordmaster_move.png', walk_f: '' },
    bonus: { hp:2, str:2, skl:3, spd:3, def:1, res:2 }
  },
  cleric: {
    name: '修女', weapons: ['staff'], mov: 5,
    promo: [{ to: 'bishop' }, { to: 'valkyrie' }],
    caps: { hp:60, str:5, mag:20, skl:20, spd:20, lck:30, def:10, res:25 },
    sprites: { stand_m: 'cleric_stand.png', stand_f: '', walk_m: 'cleric_move.png', walk_f: '' }
  },
  bishop: {
    name: '司祭', weapons: ['staff','fire','thunder','wind'], mov: 5, promoted: true,
    caps: { hp:60, str:5, mag:28, skl:25, spd:22, lck:30, def:15, res:30 },
    sprites: { stand_m: 'bishop_stand.png', stand_f: '', walk_m: 'bishop_move.png', walk_f: '' },
    bonus: { hp:3, mag:3, skl:2, spd:1, def:2, res:3 }
  },
  valkyrie: { 
    name: '聖女騎士', weapons: ['staff','fire'], mov: 7, promoted: true, tags: ['mounted'],
    caps: { hp:60, str:5, mag:25, skl:22, spd:25, lck:30, def:12, res:28 },
    sprites: { stand_m: '', stand_f: 'valkyrie_F_stand.png', walk_m: '', walk_f: 'valkyrie_F_walk.png' },
    bonus: { hp:2, mag:2, skl:2, spd:3, def:1, res:3 }
  },
  mage: {
    name: '魔法師', weapons: ['fire','thunder','wind'], mov: 5,
    promo: [{ to: 'sage' }, { to: 'mageKnight' }],
    caps: { hp:60, str:5, mag:20, skl:20, spd:20, lck:30, def:15, res:20 },
    sprites: { stand_m: 'mage_stand.png', stand_f: '', walk_m: 'mage_move.png', walk_f: '' }
  },
  sage: {
    name: '賢者', weapons: ['fire','thunder','wind','staff'], mov: 5, promoted: true,
    caps: { hp:60, str:5, mag:28, skl:25, spd:24, lck:30, def:18, res:25 },
    sprites: { stand_m: 'sage_stand.png', stand_f: '', walk_m: 'sage_move.png', walk_f: '' },
    bonus: { hp:3, mag:3, skl:2, spd:2, def:2, res:2 }
  },
  mageKnight: { 
    name: '魔法騎士', weapons: ['fire','thunder','wind'], mov: 7, promoted: true, tags: ['mounted'],
    caps: { hp:60, str:5, mag:25, skl:22, spd:25, lck:30, def:18, res:22 },
    sprites: { stand_m: 'mageKnight_M_stand.png', stand_f: 'mageKnight_F_stand.png', walk_m: 'mageKnight_M_walk.png', walk_f: 'mageKnight_F_walk.png' },
    bonus: { hp:3, mag:2, skl:2, spd:3, def:2, res:2 }
  },
  wyvernRider: {
    name: '飛龍騎士', weapons: ['lance'], mov: 7, tags: ['flying','mounted'],
    promo: [{ to: 'wyvernLord' }],
    caps: { hp:60, str:22, mag:5, skl:18, spd:18, lck:30, def:22, res:10 },
    sprites: { stand_m: 'wyvernRider_M_stand.png', stand_f: 'wyvernRider_F_stand.png', walk_m: 'wyvernRider_M_walk.png', walk_f: 'wyvernRider_F_walk.png' }
  },
  wyvernLord: { 
    name: '飛龍將', weapons: ['lance','sword'], mov: 8, promoted: true, tags: ['flying','mounted'],
    caps: { hp:60, str:28, mag:5, skl:24, spd:22, lck:30, def:28, res:15 },
    sprites: { stand_m: 'wyvernLord_M_stand.png', stand_f: 'wyvernLord_F_stand.png', walk_m: 'wyvernLord_M_walk.png', walk_f: 'wyvernLord_F_walk.png' },
    bonus: { hp:4, str:2, skl:2, spd:2, def:3, res:2 }
  },
  pegasusKnight: {
    name: '天馬騎士', weapons: ['lance'], mov: 7, tags: ['flying','mounted'],
    promo: [{ to: 'falconKnight' }],
    caps: { hp:60, str:18, mag:10, skl:22, spd:24, lck:30, def:16, res:22 },
    sprites: { stand_m: '', stand_f: 'pegasusKnight_F_stand.png', walk_m: '', walk_f: 'pegasusKnight_F_walk.png' }
  },
  falconKnight: { 
    name: '隼騎士', weapons: ['lance','sword'], mov: 8, promoted: true, tags: ['flying','mounted'],
    caps: { hp:60, str:22, mag:15, skl:26, spd:28, lck:30, def:20, res:28 },
    sprites: { stand_m: '', stand_f: 'falconKnight_F_stand.png', walk_m: '', walk_f: 'falconKnight_F_walk.png' },
    bonus: { hp:3, str:2, skl:2, spd:2, def:2, res:3 }
  },
  thief: {
    name: '盜賊', weapons: ['sword'], mov: 6,
    promo: [{ to: 'assassin' }],
    caps: { hp:60, str:18, mag:5, skl:24, spd:26, lck:30, def:14, res:16 },
    sprites: { stand_m: 'thief_stand.png', stand_f: '', walk_m: 'thief_move.png', walk_f: '' }
  },
  assassin: {
    name: '刺客', weapons: ['sword'], mov: 6, promoted: true,
    caps: { hp:60, str:22, mag:5, skl:30, spd:30, lck:30, def:18, res:20 },
    sprites: { stand_m: 'assassin_stand.png', stand_f: '', walk_m: 'assassin_move.png', walk_f: '' },
    bonus: { hp:2, str:2, skl:3, spd:3, def:1, res:2 },
    critBonus: 15
  },
  knight: {
    name: '重裝騎士', weapons: ['lance'], mov: 4, tags: ['armored'],
    promo: [{ to: 'general' }],
    caps: { hp:60, str:24, mag:5, skl:18, spd:12, lck:30, def:28, res:10 },
    sprites: { stand_m: 'knight_stand.png', stand_f: '', walk_m: 'knight_move.png', walk_f: '' }
  },
  general: {
    name: '將軍', weapons: ['lance','axe'], mov: 4, promoted: true, tags: ['armored'],
    caps: { hp:60, str:28, mag:5, skl:22, spd:14, lck:30, def:30, res:14 },
    sprites: { stand_m: 'general_stand.png', stand_f: '', walk_m: 'general_move.png', walk_f: '' },
    bonus: { hp:5, str:3, skl:1, spd:0, def:5, res:1 }
  },
  // Enemy-only classes
  soldier: {
    name: '士兵', weapons: ['lance'], mov: 5,
    caps: { hp:60, str:20, mag:5, skl:20, spd:20, lck:30, def:20, res:20 },
    sprites: { stand_m: 'soldier_stand.png', stand_f: '', walk_m: 'soldier_move.png', walk_f: '' }
  },
  darkMage: {
    name: '暗黑魔法師', weapons: ['dark'], mov: 5,
    caps: { hp:60, str:5, mag:25, skl:20, spd:18, lck:30, def:15, res:22 },
    sprites: { stand_m: 'darkmage_stand.png', stand_f: '', walk_m: 'darkmage_move.png', walk_f: '' }
  },
  brigand: {
    name: '山賊', weapons: ['axe'], mov: 5,
    caps: { hp:60, str:20, mag:5, skl:14, spd:16, lck:30, def:14, res:10 },
    sprites: { stand_m: 'brigand_stand.png', stand_f: '', walk_m: 'brigand_move.png', walk_f: '' }
  },
  skeleton: {
    name: '骷髏兵', weapons: ['lance','axe'], mov: 5, tags: ['undead'],
    caps: { hp:60, str:18, mag:5, skl:12, spd:14, lck:0, def:16, res:5 },
    sprites: { stand_m: 'skeleton_stand.png', stand_f: '', walk_m: 'skeleton_move.png', walk_f: '' }
  }
};

function getClassDef(classId) {
  return CLASSES[classId] || CLASSES.soldier;
}
// Alias for compatibility
function getClassData(classId) {
  return getClassDef(classId);
}

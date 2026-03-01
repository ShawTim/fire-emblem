const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, 'js', 'data', 'classes.js');
let content = fs.readFileSync(classesPath, 'utf-8');

// Sprite mappings - new format with stand_m, stand_f, walk_m, walk_f
const updates = {
  lord: `sprites: { stand_m: 'lord_M_stand.png', stand_f: 'lord_F_stand.png', walk_m: 'lord_M_walk.png', walk_f: 'lord_F_walk.png' }`,
  masterLord: `sprites: { stand_m: 'masterLord_M_stand.png', stand_f: 'masterLord_F_stand.png', walk_m: 'masterLord_M_walk.png', walk_f: 'masterLord_F_walk.png' }`,
  cavalier: `sprites: { stand_m: 'cavalier_M_stand.png', stand_f: 'cavalier_F_stand.png', walk_m: 'cavalier_M_walk.png', walk_f: 'cavalier_F_walk.png' }`,
  paladin: `sprites: { stand_m: 'paladin_M_stand.png', stand_f: 'paladin_F_stand.png', walk_m: 'paladin_M_walk.png', walk_f: 'paladin_F_walk.png' }`,
  greatKnight: `sprites: { stand_m: 'greatKnight_M_stand.png', stand_f: 'greatKnight_F_stand.png', walk_m: 'greatKnight_M_walk.png', walk_f: 'greatKnight_F_walk.png' }`,
  ranger: `sprites: { stand_m: 'ranger_M_stand.png', stand_f: 'ranger_F_stand.png', walk_m: 'ranger_M_walk.png', walk_f: 'ranger_F_walk.png' }`,
  hero: `sprites: { stand_m: 'hero_M_stand.png', stand_f: 'hero_F_stand.png', walk_m: 'hero_M_walk.png', walk_f: 'hero_F_walk.png' }`,
  valkyrie: `sprites: { stand_m: 'valkyrie_M_stand.png', stand_f: 'valkyrie_F_stand.png', walk_m: 'valkyrie_M_walk.png', walk_f: 'valkyrie_F_walk.png' }`,
  mageKnight: `sprites: { stand_m: 'mageKnight_M_stand.png', stand_f: 'mageKnight_F_stand.png', walk_m: 'mageKnight_M_walk.png', walk_f: 'mageKnight_F_walk.png' }`,
  wyvernRider: `sprites: { stand_m: 'wyvernRider_M_stand.png', stand_f: 'wyvernRider_F_stand.png', walk_m: 'wyvernRider_M_walk.png', walk_f: 'wyvernRider_F_walk.png' }`,
  wyvernLord: `sprites: { stand_m: 'wyvernLord_M_stand.png', stand_f: 'wyvernLord_F_stand.png', walk_m: 'wyvernLord_M_walk.png', walk_f: 'wyvernLord_F_walk.png' }`,
  pegasusKnight: `sprites: { stand_m: 'pegasusKnight_M_stand.png', stand_f: 'pegasusKnight_F_stand.png', walk_m: 'pegasusKnight_M_walk.png', walk_f: 'pegasusKnight_F_walk.png' }`,
  falconKnight: `sprites: { stand_m: 'falconKnight_M_stand.png', stand_f: 'falconKnight_F_stand.png', walk_m: 'falconKnight_M_walk.png', walk_f: 'falconKnight_F_walk.png' }`
};

let count = 0;
for (const [classKey, spriteStr] of Object.entries(updates)) {
  // Match the class definition and replace/add sprites
  const regex = new RegExp(`${classKey}:\\s*\\{([^}]*?)(sprites:\\s*\\{[^}]*\\})([^}]*?)\\}`, 's');
  
  if (regex.test(content)) {
    content = content.replace(regex, `${classKey}: { $1${spriteStr}$3 }`);
    console.log(`✓ Updated ${classKey}`);
    count++;
  } else {
    // Try adding sprites to class without existing sprites field
    const addRegex = new RegExp(`${classKey}:\\s*\\{([^}]*?)(caps:\\s*\\{[^}]*\\})`, 's');
    if (addRegex.test(content)) {
      content = content.replace(addRegex, `${classKey}: { $1$2, ${spriteStr}`);
      console.log(`✓ Added sprites to ${classKey}`);
      count++;
    } else {
      console.log(`- Could not find ${classKey}`);
    }
  }
}

fs.writeFileSync(classesPath, content, 'utf-8');
console.log(`\nUpdated ${count} classes with new sprite format.`);

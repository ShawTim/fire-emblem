#!/usr/bin/env node
// Update classes.js with new sprite paths
const fs = require('fs');
const path = require('path');

const classesPath = path.join(__dirname, '..', 'js', 'data', 'classes.js');
const spriteDir = path.join(__dirname, '..', 'assets', 'sprites', 'map');

// Read the file
let content = fs.readFileSync(classesPath, 'utf-8');

// Mapping of class keys to their sprite files
const spriteMapping = {
  lord: { stand_m: 'lord_M_stand.png', stand_f: 'lord_F_stand.png', walk_m: 'lord_M_walk.png', walk_f: 'lord_F_walk.png' },
  masterLord: { stand_m: 'masterLord_M_stand.png', stand_f: 'masterLord_F_stand.png', walk_m: 'masterLord_M_walk.png', walk_f: 'masterLord_F_walk.png' },
  cavalier: { stand_m: 'cavalier_M_stand.png', stand_f: 'cavalier_F_stand.png', walk_m: 'cavalier_M_walk.png', walk_f: 'cavalier_F_walk.png' },
  paladin: { stand_m: 'paladin_M_stand.png', stand_f: 'paladin_F_stand.png', walk_m: 'paladin_M_walk.png', walk_f: 'paladin_F_walk.png' },
  greatKnight: { stand_m: 'greatKnight_M_stand.png', stand_f: 'greatKnight_F_stand.png', walk_m: 'greatKnight_M_walk.png', walk_f: 'greatKnight_F_walk.png' },
  ranger: { stand_m: 'ranger_M_stand.png', stand_f: 'ranger_F_stand.png', walk_m: 'ranger_M_walk.png', walk_f: 'ranger_F_walk.png' },
  hero: { stand_m: 'hero_M_stand.png', stand_f: 'hero_F_stand.png', walk_m: 'hero_M_walk.png', walk_f: 'hero_F_walk.png' },
  valkyrie: { stand_m: 'valkyrie_M_stand.png', stand_f: 'valkyrie_F_stand.png', walk_m: 'valkyrie_M_walk.png', walk_f: 'valkyrie_F_walk.png' },
  mageKnight: { stand_m: 'mageKnight_M_stand.png', stand_f: 'mageKnight_F_stand.png', walk_m: 'mageKnight_M_walk.png', walk_f: 'mageKnight_F_walk.png' },
  wyvernRider: { stand_m: 'wyvernRider_M_stand.png', stand_f: 'wyvernRider_F_stand.png', walk_m: 'wyvernRider_M_walk.png', walk_f: 'wyvernRider_F_walk.png' },
  wyvernLord: { stand_m: 'wyvernLord_M_stand.png', stand_f: 'wyvernLord_F_stand.png', walk_m: 'wyvernLord_M_walk.png', walk_f: 'wyvernLord_F_walk.png' },
  pegasusKnight: { stand_m: 'pegasusKnight_M_stand.png', stand_f: 'pegasusKnight_F_stand.png', walk_m: 'pegasusKnight_M_walk.png', walk_f: 'pegasusKnight_F_walk.png' },
  falconKnight: { stand_m: 'falconKnight_M_stand.png', stand_f: 'falconKnight_F_stand.png', walk_m: 'falconKnight_M_walk.png', walk_f: 'falconKnight_F_walk.png' }
};

// Check which sprite files exist
const existingSprites = fs.existsSync(spriteDir) ? fs.readdirSync(spriteDir) : [];

console.log('Updating classes.js with sprite mappings...\n');

// Replace sprites for each class
for (const [classKey, sprites] of Object.entries(spriteMapping)) {
  const regex = new RegExp(`${classKey}:\\s*\\{[^}]*sprites:\\s*\\{[^}]*\\}[^}]*\\}`, 's');
  
  if (regex.test(content)) {
    content = content.replace(regex, (match) => {
      // Build new sprites object
      const spriteEntries = Object.entries(sprites)
        .filter(([key]) => existingSprites.includes(`assets/sprites/map/${sprites[key]}`) || true) // Keep all for now
        .map(([key, filename]) => `    ${key}: '${filename}'`)
        .join(',\n');
      
      // Replace the sprites section
      return match.replace(/sprites:\s*\{[^}]*\}/, `sprites: {\n${spriteEntries}\n  }`);
    });
    console.log(`✓ Updated ${classKey}`);
  } else {
    console.log(`- Skipped ${classKey} (no sprites field or not found)`);
  }
}

// Write back
fs.writeFileSync(classesPath, content, 'utf-8');
console.log('\nDone!');

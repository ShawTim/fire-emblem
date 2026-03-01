#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const content = fs.readFileSync(path.join(__dirname, 'js/data/classes.js'), 'utf8');

// Create a context and evaluate the code
const context = {
  module: { exports: {} },
  exports: {}
};

// Extract just the CLASSES object by wrapping it
const wrapped = `(function() { ${content}; return CLASSES; })()`;

try {
  const CLASSES = vm.runInNewContext(wrapped, context);
  
  console.log('=== Classes Analysis ===\n');
  
  const complete = [];
  const incomplete = [];
  
  Object.entries(CLASSES).forEach(([cls, def]) => {
    const sprites = def.sprites || {};
    const has_stand_m = !!sprites.stand_m;
    const has_stand_f = !!sprites.stand_f;
    const has_walk_m = !!sprites.walk_m;
    const has_walk_f = !!sprites.walk_f;
    
    if (has_stand_m && has_stand_f && has_walk_m && has_walk_f) {
      complete.push(cls);
    } else {
      const missing = [];
      if (!has_stand_m) missing.push('stand_m');
      if (!has_stand_f) missing.push('stand_f');
      if (!has_walk_m) missing.push('walk_m');
      if (!has_walk_f) missing.push('walk_f');
      
      // Check what sprites exist
      const existing = [];
      if (sprites.stand) existing.push(`stand:${sprites.stand}`);
      if (sprites.move) existing.push(`move:${sprites.move}`);
      if (sprites.stand_m) existing.push(`stand_m:${sprites.stand_m}`);
      if (sprites.stand_f) existing.push(`stand_f:${sprites.stand_f}`);
      if (sprites.walk_m) existing.push(`walk_m:${sprites.walk_m}`);
      if (sprites.walk_f) existing.push(`walk_f:${sprites.walk_f}`);
      
      incomplete.push({ cls, missing, existing, sprites });
    }
  });
  
  console.log(`COMPLETE (has all 4 fields): ${complete.length}`);
  complete.forEach(c => console.log('  -', c));
  
  console.log(`\nMISSING/INCOMPLETE: ${incomplete.length}`);
  incomplete.forEach(({ cls, missing, existing }) => {
    console.log(`  ${cls}:`);
    console.log(`    Missing: ${missing.join(', ')}`);
    console.log(`    Existing: ${existing.join(', ') || 'none'}`);
  });
  
  console.log('\n\n=== Summary ===');
  console.log(`Total classes: ${Object.keys(CLASSES).length}`);
  console.log(`Complete: ${complete.length}`);
  console.log(`Incomplete: ${incomplete.length}`);
  
  // Output JSON for further processing
  console.log('\n\n=== JSON Output ===');
  console.log(JSON.stringify({ 
    total: Object.keys(CLASSES).length,
    complete, 
    incomplete 
  }, null, 2));
  
} catch (e) {
  console.error('Error:', e.message);
}

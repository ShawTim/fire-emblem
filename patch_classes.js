const fs = require('fs');
let code = fs.readFileSync('/home/openclaw/work/fire-emblem/js/data/classes.js', 'utf8');

// I'll define a baseStats generation based on caps
code = code.replace(/caps: \{ (hp:\d+, str:\d+, mag:\d+, skl:\d+, spd:\d+, lck:\d+, def:\d+, res:\d+) \}/g, (match, caps) => {
    // Generate baseStats roughly 1/3 of caps
    const pairs = caps.split(', ');
    const bases = pairs.map(p => {
        const [k, v] = p.split(':');
        return `${k}:${Math.floor(parseInt(v)/3)}`;
    }).join(', ');
    return `caps: { ${caps} },\n    baseStats: { ${bases} }`;
});

fs.writeFileSync('/home/openclaw/work/fire-emblem/js/data/classes.js', code);
console.log("classes.js patched");

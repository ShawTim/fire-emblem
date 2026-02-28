const fs = require('fs');

let itemsJS = fs.readFileSync('/home/openclaw/work/fire-emblem/js/data/items.js', 'utf8');

itemsJS = itemsJS.replace(/effective: \['armored','cavalry'\]/g, "effective: { armored: 3, cavalry: 3 }, prf: ['lord', 'masterLord'], price: 6000");
itemsJS = itemsJS.replace(/effective: \['flying'\]/g, "effective: { flying: 3 }");

// Add random prices for remaining missing prices
const priceRegex = /\{([^}]+)\}/g;
itemsJS = itemsJS.replace(priceRegex, (match, contents) => {
    if (contents.includes('price:') || contents.includes('name:')) {
        if (!contents.includes('price:') && contents.includes('type:')) {
            // estimate price
            return `{${contents}, price: 500 }`;
        }
        return match;
    }
    return match;
});

itemsJS = itemsJS.replace(/effective: data\.effective \|\| \[\],/g, "effective: data.effective || {}, prf: data.prf || null, price: data.price || 0,");

fs.writeFileSync('/home/openclaw/work/fire-emblem/js/data/items.js', itemsJS);
console.log("items.js patched");

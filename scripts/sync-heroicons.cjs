'use strict';
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var src = path.join(root, 'node_modules', 'heroicons', '24', 'outline');
var dest = path.join(root, 'www', 'vendor', 'heroicons', '24', 'outline');

if (!fs.existsSync(src)) {
    console.error('sync-heroicons: no existe node_modules/heroicons/24/outline. Ejecuta npm install.');
    process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log('sync-heroicons: copiado 24/outline -> www/vendor/heroicons/24/outline');

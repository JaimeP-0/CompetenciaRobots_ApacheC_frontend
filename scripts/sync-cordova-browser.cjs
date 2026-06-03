'use strict';

/**
 * Copia cordova.js y plugins desde platforms/browser/www → www/
 * (necesario para VPS y para abrir www/ sin prepare en la ruta de deploy).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'platforms', 'browser', 'www');
const dest = path.join(root, 'www');

function copyFile(name) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (!fs.existsSync(from)) {
        return false;
    }
    fs.copyFileSync(from, to);
    return true;
}

function copyDir(name) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (!fs.existsSync(from)) {
        return false;
    }
    fs.cpSync(from, to, { recursive: true });
    return true;
}

if (!fs.existsSync(path.join(src, 'cordova.js'))) {
    console.error('[sync-cordova-browser] Falta platforms/browser/www/cordova.js');
    console.error('  Ejecuta: npx cordova prepare browser');
    process.exit(1);
}

copyFile('cordova.js');
copyFile('cordova_plugins.js');
copyDir('plugins');

console.error('[sync-cordova-browser] cordova.js + plugins copiados a www/');

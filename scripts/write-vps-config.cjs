'use strict';

/** Copia config VPS a www antes de subir al servidor. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'deploy', 'vps', 'config.local.vps.js');
const dest = path.join(root, 'www', 'js', 'config.local.js');

let text = fs.readFileSync(src, 'utf8');
const url = (process.env.CR_PUBLIC_URL || 'https://utarena.online').replace(/\/$/, '');
text = text.replace(/https?:\/\/[^'"]+/g, url);
fs.writeFileSync(dest, text, 'utf8');
process.stderr.write('[build:vps] config.local.js → ' + url + '\n');

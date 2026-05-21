'use strict';

/**
 * Tras prepare: copia MainActivity y build-extras.gradle (Android);
 * corrige rutas de iconos en manifest del browser (src relativos a www/).
 */
module.exports = function (context) {
    const fs = require('fs');
    const path = require('path');
    const root = context.opts.projectRoot;

    const androidApp = path.join(root, 'platforms', 'android', 'app');
    if (fs.existsSync(androidApp)) {
        const extrasSrc = path.join(root, 'res', 'native', 'android', 'build-extras.gradle');
        const extrasDest = path.join(androidApp, 'build-extras.gradle');
        if (fs.existsSync(extrasSrc)) {
            fs.copyFileSync(extrasSrc, extrasDest);
        }
        const destDir = path.join(
            root,
            'platforms',
            'android',
            'app',
            'src',
            'main',
            'java',
            'com',
            'cr',
            'competenciarobots'
        );
        if (fs.existsSync(destDir)) {
            const src = path.join(root, 'res', 'native', 'android', 'MainActivity.java');
            const dest = path.join(destDir, 'MainActivity.java');
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
            }
        }
    }

    const browserManifest = path.join(root, 'platforms', 'browser', 'www', 'manifest.json');
    if (!fs.existsSync(browserManifest)) {
        return;
    }
    try {
        const raw = fs.readFileSync(browserManifest, 'utf8');
        const o = JSON.parse(raw);
        if (!Array.isArray(o.icons)) {
            return;
        }
        let changed = false;
        o.icons = o.icons.map(function (entry) {
            if (!entry || typeof entry.src !== 'string') {
                return entry;
            }
            const fixed = entry.src.replace(/^www\//, '');
            if (fixed !== entry.src) {
                changed = true;
                return Object.assign({}, entry, { src: fixed });
            }
            return entry;
        });
        if (changed) {
            fs.writeFileSync(browserManifest, JSON.stringify(o, null, 2) + '\n', 'utf8');
        }
    } catch (e) {
        /* no bloquear prepare */
    }
};
